import cv2
import DlibGetDataPoints
import psycopg2
import sys, os
from subprocess import call
import re

#first argument is path to images, second is the videoID being operated on
def main(argv):
	if(len(sys.argv) != 3):
		print("Error! Invalid number of arguments")
		sys.exit(2) 
	elif(sys.argv[1][0] != '/' and sys.argv[1][len(sys.argv[1]) - 1] != '/'):
		print("Error! Not a valid directory")
		sys.exit(2)
	else: #make sure there's an entry for the input videoID
		try:
			conn=psycopg2.connect("dbname='cs160' user='postgres' host='localhost' password='student'")
		except:
			print("Unable to connect to the database.")
		cur = conn.cursor()
		cur.execute("""SELECT * FROM "Video" where videoid=%s""", (sys.argv[2], ))
		if(cur.fetchone() == None):
			print("No such videoID in the database")
			sys.exit(2)
		else:
			imageDirectory = sys.argv[1]
			videoID = sys.argv[2]
	#bind our python point type to be output of queries returning postgres point type
	createPointType(cur) 

	#get the frame count, dimensions, etc of the video
	cur.execute("""SELECT frame_count, width, height, fps FROM "Video"
				where videoid=%s""", (videoID,))
	values = cur.fetchone()
	frame_count = values[0]
	width = values[1]
	height = values[2]
	fps = values[3]
	drawOverTheImages(imageDirectory, frame_count, videoID, cur, fps)

	
"""
draws the delaunay triangles over the images in the given directory and 
dumps the output images
takes arguments for the imageDriectory, frame_count, videoID, and 
the cursor for the database connection
"""
def drawOverTheImages(imageDirectory, frame_count, videoID, cur, fps):
	# Define colors for drawing.
	delaunay_color = (255,0,0)
	points_color = (0, 0, 255)
	#output directory
	outputDirectory = imageDirectory[:-1]
	#truncate characters off until we reach the root directory
	while(outputDirectory[-1:] != '/'):
		outputDirectory = outputDirectory[:-1]
	rootDirectory = outputDirectory
	outputDirectory = outputDirectory + 'output_images_video_' + str(videoID) + '/';
	# create directory to store the files
	if not os.path.exists(outputDirectory):
		os.makedirs(outputDirectory)
	#iterate over each image in the directory
	for frame in range(1, frame_count + 1):
		#images follow naming convention videoId.frame_number.jpg
		imagePath = imageDirectory + str(videoID) + '.' + str(frame) + '.png'
		outputImage = outputDirectory + str(videoID) + '.' + str(frame) + '.out.png'
		cur.execute("""SELECT datapoint1, datapoint2, datapoint3, datapoint4, datapoint5, datapoint6, 
		datapoint7, datapoint8, datapoint9, datapoint10, datapoint11, datapoint12, 
		datapoint13, datapoint14, datapoint15, datapoint16, datapoint17, datapoint18, 
		datapoint19, datapoint20, datapoint21, datapoint22, datapoint23, datapoint24, 
		datapoint25, datapoint26, datapoint27, datapoint28, datapoint29, datapoint30, 
		datapoint31, datapoint32, datapoint33, datapoint34, datapoint35, datapoint36, 
		datapoint37, datapoint38, datapoint39, datapoint40, datapoint41, datapoint42, 
		datapoint43, datapoint44, datapoint45, datapoint46, datapoint47, datapoint48, 
		datapoint49, datapoint50, datapoint51, datapoint52, datapoint53, datapoint54, 
		datapoint55, datapoint56, datapoint57, datapoint58, datapoint59, datapoint60, 
		datapoint61, datapoint62, datapoint63, datapoint64, datapoint65, datapoint66, 
		datapoint67, datapoint68 FROM "OpenFaceData" WHERE videoid=%s AND frame_number=%s
		""", (videoID, frame))
		current_points = cur.fetchone()
		#now begin using code from the sample program
		#put the data points in a list
		points = [];
		for point in current_points:
			points.append((int(point.x), int(point.y))); #openface gives floats, opencv needs ints
		# Read in the image.
		img = cv2.imread(imagePath);
		# Keep a copy around
		img_orig = img.copy();
		# Rectangle to be used with Subdiv2D
		size = img.shape
		rect = (0, 0, size[1], size[0])
		# Create an instance of Subdiv2D
		subdiv = cv2.Subdiv2D(rect);
		#insert the points into subdiv
		for point in points:
			subdiv.insert(point)
		# Draw delaunay triangles
		draw_delaunay (img, subdiv, (255, 0, 0));
		# Draw points
		for p in points :
			draw_point(img, p, (0,0,255))
		cv2.imwrite(outputImage, img);
	#stitch the images together with ffmpeg
	#ffmpeg -framerate 24 -i img%03d.png output.mp4
	outputFileName = rootDirectory + str(videoID) + '.mp4'
	imagesToStitch = outputDirectory + str(videoID) + '.%d.out.png'
	call(['ffmpeg', '-framerate', str(fps), '-i', imagesToStitch, outputFileName ])

#cast postgresql point type to our user defined point type (see dlibgetdatapoints.py)
def cast_point(value, cur):
	if value is None:
		return None
	# Convert from (f1, f2) syntax using a regular expression.
	m = re.match(r"\(([^)]+),([^)]+)\)", value)
	if m:
		return DlibGetDataPoints.Point(float(m.group(1)), float(m.group(2)))
	else:
		raise InterfaceError("bad point representation: %r" % value)

#binds our user defined point type as output of postgres point types
def createPointType(cur): 
	cur.execute("SELECT NULL::point") #must get the oid for the point class
	point_oid = cur.description[0][1]
	POINT = psycopg2.extensions.new_type((point_oid,), "POINT", cast_point)
	psycopg2.extensions.register_type(POINT)

# Check if a point is inside a rectangle. 
# from Robert Bruce example_draw_delaunay_triangles.py
def rect_contains(rect, point) :
    if point[0] < rect[0] :
        return False
    elif point[1] < rect[1] :
        return False
    elif point[0] > rect[2] :
        return False
    elif point[1] > rect[3] :
        return False
    return True
 
# Draw a point
# from Robert Bruce example_draw_delaunay_triangles.py
def draw_point(img, p, color ) :
    cv2.circle (img, p, 3, color, cv2.FILLED, lineType=cv2.LINE_AA, shift=0)

# Draw delaunay triangles
# from Robert Bruce example_draw_delaunay_triangles.py
def draw_delaunay(img, subdiv, delaunay_color ) :
 
    triangleList = subdiv.getTriangleList();
    size = img.shape
    r = (0, 0, size[1], size[0])
 
    for t in triangleList :
        pt1 = (t[0], t[1])
        pt2 = (t[2], t[3])
        pt3 = (t[4], t[5])
        if rect_contains(r, pt1) and rect_contains(r, pt2) and rect_contains(r, pt3) :
            cv2.line(img, pt1, pt2, delaunay_color, thickness=1, lineType=cv2.LINE_AA, shift=0)
            cv2.line(img, pt2, pt3, delaunay_color, thickness=1, lineType=cv2.LINE_AA, shift=0)
            cv2.line(img, pt3, pt1, delaunay_color, thickness=1, lineType=cv2.LINE_AA, shift=0)
 

if __name__ == "__main__":
   main(sys.argv[1:])
