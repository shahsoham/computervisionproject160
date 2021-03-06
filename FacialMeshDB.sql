-- Authors: Changtong Zhou, Bundit Hongmanee, Jonathan Neel, Soham Shah
-- Date: May 15, 2017CREATE DATABASE cs160;
\c cs160

DROP TABLE IF EXISTS "users" CASCADE;
CREATE TABLE "users" (
	userID serial NOT NULL PRIMARY KEY,
	email text,
	username varchar(50),
	password varchar(50),
	firstName varchar(50),
	lastName varchar(50),
	lastLogin timestamp default now(),
	lastIPLocation varchar(256),
	createdAt timestamp default now(),
	salt varchar(50) --should this really be stored in the database or computed each time? srs question!
);

DROP TABLE IF EXISTS "Video" CASCADE;
CREATE TABLE "Video" (
	videoID	serial NOT NULL PRIMARY KEY,
	userID	int NOT NULL,
	FOREIGN KEY (userID) references "users"(userID) ON DELETE CASCADE,
	frame_count	int,
	width	int,
	height	int,
	fps	real,
	imageDirectory varchar(75)
);

DROP TABLE IF EXISTS "Frame" CASCADE;


DROP TABLE IF EXISTS "SkullPosition" CASCADE;
CREATE TABLE "SkullPosition" (
	videoID int NOT NULL,
	FOREIGN KEY (videoID) references "Video"(videoID) ON DELETE CASCADE,
	frame_number	int,
	yaw real, --degrees or radians?
	pitch real,
	roll real,
	PRIMARY KEY(videoID, frame_number)
);

DROP TABLE IF EXISTS "PupilData" CASCADE;
CREATE TABLE "PupilData" (
	videoID int NOT NULL,
	FOREIGN KEY (videoID) references "Video"(videoID) ON DELETE CASCADE,
	frame_number	int,
	leftOpenFaceEye	point,
	rightOpenFaceEye	point,
	leftFabianPupil	point,
	rightFabianPupil	point,
	PRIMARY KEY(videoID, frame_number)
);

DROP TABLE IF EXISTS "OpenFaceData" CASCADE;
CREATE TABLE "OpenFaceData" (
	videoID int NOT NULL,
	FOREIGN KEY (videoID) references "Video"(videoID) ON DELETE CASCADE,
	frame_number int,
	dataPoint1   point,
	dataPoint2   point,
	dataPoint3   point,
	dataPoint4   point,
	dataPoint5   point,
	dataPoint6   point,
	dataPoint7   point,
	dataPoint8   point,
	dataPoint9   point,
	dataPoint10   point,
	dataPoint11   point,
	dataPoint12   point,
	dataPoint13   point,
	dataPoint14   point,
	dataPoint15   point,
	dataPoint16   point,
	dataPoint17   point,
	dataPoint18   point,
	dataPoint19   point,
	dataPoint20   point,
	dataPoint21   point,
	dataPoint22   point,
	dataPoint23   point,
	dataPoint24   point,
	dataPoint25   point,
	dataPoint26   point,
	dataPoint27   point,
	dataPoint28   point,
	dataPoint29   point,
	dataPoint30   point,
	dataPoint31   point,
	dataPoint32   point,
	dataPoint33   point,
	dataPoint34   point,
	dataPoint35   point,
	dataPoint36   point,
	dataPoint37   point,
	dataPoint38   point,
	dataPoint39   point,
	dataPoint40   point,
	dataPoint41   point,
	dataPoint42   point,
	dataPoint43   point,
	dataPoint44   point,
	dataPoint45   point,
	dataPoint46   point,
	dataPoint47   point,
	dataPoint48   point,
	dataPoint49   point,
	dataPoint50   point,
	dataPoint51   point,
	dataPoint52   point,
	dataPoint53   point,
	dataPoint54   point,
	dataPoint55   point,
	dataPoint56   point,
	dataPoint57   point,
	dataPoint58   point,
	dataPoint59   point,
	dataPoint60   point,
	dataPoint61   point,
	dataPoint62   point,
	dataPoint63   point,
	dataPoint64   point,
	dataPoint65   point,
	dataPoint66   point,
	dataPoint67   point,
	dataPoint68   point,
	PRIMARY KEY(videoID, frame_number)
);
