import sys
from subprocess import call, check_output
import os
import psycopg2

#video path, userID are the command line arguments
def main(argv):
	videoPath = sys.argv[1]
	userID = sys.argv[2]
	#create a directory to store the current user's videos if there doesn't already exist one
	outputDirectory = '/home/jonomint/Desktop/CV_project/users/user_' + userID
	if not os.path.exists(outputDirectory):
		os.makedirs(outputDirectory)
	#getting video framecount
	frame_count = int(check_output(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v:0', 
		'-show_entries', 'stream=nb_read_frames', '-of', 'default=nokey=1:noprint_wrappers=1', videoPath ]))
	#frame_rate is returned as a single string representing a ratio of ints eg: 30300/1000
	frame_rate_str = check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', 
		'-show_entries', 'stream=avg_frame_rate', '-of', 'default=noprint_wrappers=1:nokey=1', videoPath ])
	#parse and cast the string
	frame_rate = float(int(frame_rate_str.split('/')[0]) / int(frame_rate_str.split('/')[1]))
	#getting width, height
	width = int(check_output(['ffprobe', '-v', 'error', '-of', 'default=nokey=1:noprint_wrappers=1', '-select_streams', 
		'v:0', '-show_entries', 'stream=width', videoPath]))
	height = int(check_output(['ffprobe', '-v', 'error', '-of', 'default=nokey=1:noprint_wrappers=1', '-select_streams', 
		'v:0', '-show_entries', 'stream=height', videoPath]))
	
	#enter the video data into the database
	try:
		conn = psycopg2.connect("dbname='cs160' user='postgres' host='localhost' password='student'")
	except:
		print "Unable to connect to the database."

	cur = conn.cursor()
	conn.autocommit = True
	try:
		cur.execute("""INSERT INTO "Video"(userID, frame_count, width, height, fps) VALUES (%s, %s, %s, %s, %s) RETURNING videoID;""", (userID, frame_count, width, height, frame_rate))
		videoID = cur.fetchone()[0]
	except:
		print "Unable to insert into Video"
	#create a directory for the frames split from the video
	outputDirectory = outputDirectory +'/Video_' + str(videoID)
	if not os.path.exists(outputDirectory):
		os.makedirs(outputDirectory)
	outputImages = outputDirectory + '/' + str(videoID) +'.%d.png'
	try:
		cur.execute("""UPDATE "Video" SET imageDirectory=%s WHERE videoID=%s""", (outputDirectory, videoID))
	except:
		print "Unable to update Video"
	fps_str = 'fps=' + str(frame_rate)
	#split the video into frames with ffmpeg
	call(['ffmpeg', '-i', videoPath, '-vf', fps_str, outputImages])

if __name__ == "__main__":
   main(sys.argv[1:])
