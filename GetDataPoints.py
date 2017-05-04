#! /usr/bin/python
# requires install of psycopg2 (use pip), OpenFace w/ the executable, and csvkit

import sys
from subprocess import call
import os
import csv
import psycopg2
from psycopg2.extensions import adapt, register_adapter, AsIs

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
	outputDataFile = imageDirectory + 'output' + '.' + str(videoID) + '.csv'
	createDatapoints(imageDirectory, outputDataFile)
	trimmedFile = trimFile(outputDataFile)
	insertIntoDatabase(trimmedFile, 1)

""" calls the OpenFace program to dump the datapoints into a .csv
    first argument: takes an (string) input directory to look for files as 
    second argument: takes a (string) path to an output file
"""
def createDatapoints(inputDirectory, outputFile):
	call(['./FeatureExtraction', '-fdir', inputDirectory, '-asvid', '-of', outputFile, '-no3Dfp', '-noMparams', '-noAUs', '-noGaze', '-q']) 

""" calls CSV kit to trim relevant columns out of the CSV file
    takes a (string) path to a file as the argument
"""
def trimFile(fileToTrim):
	trimmedFile = fileToTrim[0:-4] + '_trimmed.csv'
	os.system("csvcut -C 2,3,4,5,6,7 "+ fileToTrim + " > " + trimmedFile)
	return trimmedFile

""" iterates over the CSV created by the trimFile function 
    to retrieve the OpenFace datapoints, then dumps into the database
"""
def insertIntoDatabase(csvInput, videoID):
	# Try to connect to the database
	try:
		conn=psycopg2.connect("dbname='cs160' user='postgres' host='localhost' password='student'")
	except:
		print "Unable to connect to the database."
	cur = conn.cursor()
	
	with open(csvInput, 'rt') as csvfile: 
		dataReader = csv.reader(csvfile, delimiter=',')
		next(dataReader) #skip header row
		for row in dataReader:
			try:
				cur.execute("""INSERT INTO "SkullPosition"(videoid, frame_number,
				yaw, pitch, roll) VALUES(%s, %s, %s, %s, %s)""", (videoID, row[0], row[3], row[2], row[1]))
			except:
				print("couldn't insert into SkullPosition")
			conn.commit()
			points = [] #instantiate an empty list to store the coordinate x y pairs
			for i in range(68):
				points.append(i)
			for index in range(4, len(row) - 68):
				points[index-4] = Point(float(row[index]), float(row[index + 68])) #store the x and y values together as a Point
			try: #the long way
				cur.execute("""INSERT INTO "OpenFaceData"(videoid, frame_number, 
				datapoint1, datapoint2, datapoint3, datapoint4, datapoint5, datapoint6, 
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
				datapoint67, datapoint68) VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
				%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
				%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
				%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""", 
				(videoID, row[0], points[0], points[1], points[2], points[3], points[4], 
				points[5], points[6], points[7], points[8], points[9], points[10], 
				points[11], points[12], points[13], points[14], points[15], points[16], 
				points[17], points[18], points[19], points[20], points[21], points[22], 
				points[23], points[24], points[25], points[26], points[27], points[28], 
				points[29], points[30], points[31], points[32], points[33], points[34], 
				points[35], points[36], points[37], points[38], points[39], points[40], 
				points[41], points[42], points[43], points[44], points[45], points[46], 
				points[47], points[48], points[49], points[50], points[51], points[52], 
				points[53], points[54], points[55], points[56], points[57], points[58], 
				points[59], points[60], points[61], points[62], points[63], points[64], 
				points[65], points[66], points[67]))
			except:
				print("couldn't insert into OpenFaceData")
			conn.commit()
			
	conn.close()

#point class to interface with PostgreSQL point class
class Point(object):
	def __init__(self, x, y):
		self.x = x
		self.y = y

#adapt point to convert to psql points
def adapt_point(point):
	x = adapt(point.x).getquoted()
	y = adapt(point.y).getquoted()
	return AsIs("'(%s, %s)'" % (x, y))

register_adapter(Point, adapt_point)

if __name__ == "__main__":
	main(sys.argv[1:])
