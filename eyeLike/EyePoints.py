import sys
from subprocess import call
import os
import psycopg2


"""
argv[1] = filepath to directory of folder of frames
argv[2] = videoID
"""
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
	# Retrieve frame count from DB and save in frame_count
	cur.execute("""SELECT frame_count FROM "Video"
				where videoid=%s""", (videoID,))
	values = cur.fetchone()
	frame_count = values[0]

	outFile = "/home/bundit/Desktop/computervisionproject160/eyeLike/EyeCoordinatesOutput.txt"

	#Delete file if exists to write new coorindates to new file
	try:
		os.remove(outFile)
	except OSError:
		pass

	#Process eyepoints and output to file
	getEyePointsToFile(imageDirectory, frame_count, videoID)
	#Read back data and insert into database
	insertEyePointsToDB(outFile, videoID, cur, conn)

	conn.close()

"""
	Processes the files in a directory and dumps the eye coordinates data into a text file
	@imageDirectory the directory with all the images to process
	@frame_count the number of frames in the directory
	@videoID ID for database
"""	
def getEyePointsToFile(imageDirectory, frame_count, videoID):

	for frame in range(1, frame_count + 1):
		#images follow naming convention videoId.frame_number.jpg
		imagePath = imageDirectory + str(videoID) + '.' + str(frame) + '.jpg'
		#print imagePath + "\n"
		call(['/home/bundit/Desktop/computervisionproject160/eyeLike/build/bin/./eyeLike', imagePath, '1', str(frame)])

"""
	Inserts the eye coordinates in the database 
	@file the file to retrieve data from
	@videoID key for database inserts
	@cur cursor used for database access
"""
def insertEyePointsToDB(file, videoID, cur, conn):
	
	#Check if file exists, if not then exit
	if not os.path.exists(file):
		print "EyeCoordinatesOutput.txt could not be found"
		sys.exit()
	#Open the file and read line by line
	try:
		with open(file) as f:
			for line in f:
				currentline = line.split(",")
				frameNum = currentline[0]
				rightX = currentline[1]
				rightY = currentline[2]
				leftX = currentline[3]
				leftY = currentline[4]
				#Insert data into database
				cur.execute("""INSERT into "PupilData"(videoID, frame_number, leftFabianPupil, rightFabianPupil) VALUES (%s, %s, Point(%s,%s), Point(%s,%s));""",(videoID, frameNum, rightX, rightY, leftX, leftY))
				conn.commit()
	except:
		print "Could not import eye coordinates into database - Error"
if __name__ == "__main__":
	main(sys.argv[1:])
