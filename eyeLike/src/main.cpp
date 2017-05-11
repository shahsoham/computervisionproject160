#include <opencv2/core/core.hpp>
#include <opencv2/objdetect/objdetect.hpp>
#include <opencv2/highgui/highgui.hpp>
#include <opencv2/opencv.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <unistd.h>

#include <fstream>
#include <iostream>
#include <queue>
#include <stdio.h>
#include <math.h>
#include <sstream>
#include <string>

#include "constants.h"
#include "findEyeCenter.h"
#include "findEyeCorner.h"

using namespace std;
using namespace cv;



/** Constants **/


/** Function Headers */
void detectAndDisplay( cv::Mat frame, const std::string& path,const std::string& frame_num );

/** Global variables */
//-- Note, either copy these two files from opencv/data/haarscascades to your current folder, or change these locations
//cv::String face_cascade_name = "../../res/haarcascade_frontalface_alt.xml";
cv::String face_cascade_name = "/home/jonomint/Desktop/160_Project/eyeLike/res/haarcascade_frontalface_alt.xml";
cv::CascadeClassifier face_cascade;
std::string main_window_name = "Capture - Face detection";
std::string face_window_name = "Capture - Face";
cv::RNG rng(12345);
cv::Mat debugImage;
cv::Mat skinCrCbHist = cv::Mat::zeros(cv::Size(256, 256), CV_8UC1);

/**
 * @function main
 * arg[1] = file path 
 * arg[2] = videoID
 * arg[3] = frame number
 */
int main( int argc, const char** argv ) {

  cv::Mat frame;

  // Load the cascades from xml doc
  if( !face_cascade.load( face_cascade_name ) ){ printf("--(!)Error loading face cascade, please change face_cascade_name in source code.\n"); return -1; };

  //open frame for processing
  frame = imread(argv[1], CV_LOAD_IMAGE_COLOR);

  if( !frame.empty() ) {
    detectAndDisplay( frame , argv[1], argv[3]);
  }
  else {
    printf("Error uploading photo, frame empty\n");
  }


  return 0;
}

void findEyes(cv::Mat frame_gray, cv::Rect face, const std::string& path, const std::string& frame_num) {
  cv::Mat faceROI = frame_gray(face);
  cv::Mat debugFace = faceROI;

  if (kSmoothFaceImage) {
    double sigma = kSmoothFaceFactor * face.width;
    GaussianBlur( faceROI, faceROI, cv::Size( 0, 0 ), sigma);
  }
  //-- Find eye regions and draw them
  int eye_region_width = face.width * (kEyePercentWidth/100.0);
  int eye_region_height = face.width * (kEyePercentHeight/100.0);
  int eye_region_top = face.height * (kEyePercentTop/100.0);
  cv::Rect leftEyeRegion(face.width*(kEyePercentSide/100.0),
                         eye_region_top,eye_region_width,eye_region_height);
  cv::Rect rightEyeRegion(face.width - eye_region_width - face.width*(kEyePercentSide/100.0),
                          eye_region_top,eye_region_width,eye_region_height);

  //-- Find Eye Centers
  cv::Point leftPupil = findEyeCenter(faceROI,leftEyeRegion,"Left Eye");
  cv::Point rightPupil = findEyeCenter(faceROI,rightEyeRegion,"Right Eye");
  // get corner regions
  cv::Rect leftRightCornerRegion(leftEyeRegion);
  leftRightCornerRegion.width -= leftPupil.x;
  leftRightCornerRegion.x += leftPupil.x;
  leftRightCornerRegion.height /= 2;
  leftRightCornerRegion.y += leftRightCornerRegion.height / 2;
  cv::Rect leftLeftCornerRegion(leftEyeRegion);
  leftLeftCornerRegion.width = leftPupil.x;
  leftLeftCornerRegion.height /= 2;
  leftLeftCornerRegion.y += leftLeftCornerRegion.height / 2;
  cv::Rect rightLeftCornerRegion(rightEyeRegion);
  rightLeftCornerRegion.width = rightPupil.x;
  rightLeftCornerRegion.height /= 2;
  rightLeftCornerRegion.y += rightLeftCornerRegion.height / 2;
  cv::Rect rightRightCornerRegion(rightEyeRegion);
  rightRightCornerRegion.width -= rightPupil.x;
  rightRightCornerRegion.x += rightPupil.x;
  rightRightCornerRegion.height /= 2;
  rightRightCornerRegion.y += rightRightCornerRegion.height / 2;
  //rectangle(debugFace,leftRightCornerRegion,200);
  //rectangle(debugFace,leftLeftCornerRegion,200);
  //rectangle(debugFace,rightLeftCornerRegion,200);
  //rectangle(debugFace,rightRightCornerRegion,200);
  // change eye centers to face coordinates
  rightPupil.x += rightEyeRegion.x;
  rightPupil.y += rightEyeRegion.y;
  leftPupil.x += leftEyeRegion.x;
  leftPupil.y += leftEyeRegion.y;
  // draw eye centers
  circle(debugFace, rightPupil, 3, 1234);
  circle(debugFace, leftPupil, 3, 1234);
  
  //output image with regions drawn
  imwrite("/home/jonomint/Desktop/pics/frame.png",frame_gray);

  //write the coordinates of left and right pupils to console
  //printf("Right Pupil Coordinates: X - %d Y - %d \n", rightPupil.x, rightPupil.y);
  //printf("Left  Pupil Coordinates: X - %d Y - %d \n", leftPupil.x, leftPupil.y);

  std::ofstream outfile;
  outfile.open("/home/jonomint/Desktop/160_Project/eyeLike/EyeCoordinatesOutput.txt", std::ofstream::out | std::ofstream::app);
  //outfile.open(&path, std::ofstream::out | std::ofstream::app);
  outfile << frame_num;
  outfile << ",";
  outfile << (rightPupil.x + face.x);
  outfile << ",";
  outfile << (rightPupil.y + face.y);
  outfile << ",";
  outfile << (leftPupil.x + face.x);
  outfile << ",";
  outfile << (leftPupil.y + face.y);
  outfile << "\n";
  
  outfile.close();

}
/**
 * @function detectAndDisplay
 */
void detectAndDisplay( cv::Mat frame , const std::string& path,const std::string& frame_num) {
  std::vector<cv::Rect> faces;
  //cv::Mat frame_gray;

  std::vector<cv::Mat> rgbChannels(3);
  cv::split(frame, rgbChannels);
  cv::Mat frame_gray = rgbChannels[2];

  //cvtColor( frame, frame_gray, CV_BGR2GRAY );
  //equalizeHist( frame_gray, frame_gray );
  //cv::pow(frame_gray, CV_64F, frame_gray);
  //-- Detect faces
  face_cascade.detectMultiScale( frame_gray, faces, 1.1, 2, 0|CV_HAAR_SCALE_IMAGE|CV_HAAR_FIND_BIGGEST_OBJECT, cv::Size(150, 150) );
//  findSkin(debugImage);

  for( int i = 0; i < faces.size(); i++ )
  {
    //rectangle(debugImage, faces[i], 1234);
  }
  //-- Show what you got
  if (faces.size() > 0) {
    findEyes(frame_gray, faces[0], path, frame_num);
  }
}

cv::Mat findSkin (cv::Mat &frame) {
  cv::Mat input;
  cv::Mat output = cv::Mat(frame.rows,frame.cols, CV_8U);

  cvtColor(frame, input, CV_BGR2YCrCb);

  for (int y = 0; y < input.rows; ++y) {
    const cv::Vec3b *Mr = input.ptr<cv::Vec3b>(y);
//    uchar *Or = output.ptr<uchar>(y);
    cv::Vec3b *Or = frame.ptr<cv::Vec3b>(y);
    for (int x = 0; x < input.cols; ++x) {
      cv::Vec3b ycrcb = Mr[x];
//      Or[x] = (skinCrCbHist.at<uchar>(ycrcb[1], ycrcb[2]) > 0) ? 255 : 0;
      if(skinCrCbHist.at<uchar>(ycrcb[1], ycrcb[2]) == 0) {
        Or[x] = cv::Vec3b(0,0,0);
      }
    }
  }

  return output;
}
