// function loopThroughPoses (poses, nose, leftEye, rightEye){

// for (let i = 0; i < poses.length; i++) {
//     // For each pose detected, loop through all the keypoints
//     let pose = poses[i].pose;
//     for (let j = 0; j < pose.keypoints.length; j++) {
//       // A keypoint is an object describing a body part (like rightArm or leftShoulder)
//       let keypoint = pose.keypoints[j];
      
//       // Only draw an ellipse is the pose probability is bigger than 0.2
//       if (keypoint.score > 0.2 ) {
//          if (keypoint.part === 'nose'){
//             nose.x = keypoint.position.x;
//             nose.y = keypoint.position.y;
//          } 
//       }
//     }
//   }
// }


function loopThroughPoses (poses, nose){
  // console.log(poses);
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      let keypoint = pose.keypoints[j];
      if (keypoint.score > 0.2 && keypoint.part === 'nose' ) {
         nose.x = keypoint.position.x;
         nose.y = keypoint.position.y;
       }
    }
  }
}

//       let noseX = 0;
//       let noseY = 0;
//       let left_eyeX = 0;
//       let left_eyeY = 0;
//       let right_eyeX = 0;
//       let right_eyeY = 0;

// function loopThroughPoses(poses,nose, leftEye, rightEye){
//           // console.log(poses);
//             if (poses.length > 0) {
//               let nX = poses[0].pose.keypoints[0].position.x;
//               let nY = poses[0].pose.keypoints[0].position.y;

//               let leX = poses[0].pose.keypoints[1].position.x;
//               let leY = poses[0].pose.keypoints[1].position.y;

//               let reX = poses[0].pose.keypoints[2].position.x;
//               let reY = poses[0].pose.keypoints[2].position.y;

//               let leaX = poses[0].pose.keypoints[3].position.x;
//               let leaY = poses[0].pose.keypoints[3].position.y;

//               let reaX = poses[0].pose.keypoints[4].position.x;
//               let reaY = poses[0].pose.keypoints[4].position.y;

              
//               noseX = Math.sqrt(noseX, nX, 0.5);
//               noseY = Math.sqrt(noseY, nY, 0.5);

//               left_eyeX = Math.sqrt(left_eyeX, leX, 0.5);
//               left_eyeY = Math.sqrt(left_eyeY, leY, 0.5);

//               right_eyeX = Math.sqrt(right_eyeX, reX, 0.5);
//               right_eyeY = Math.sqrt(right_eyeY, reY, 0.5);


//               // let dm = dist(noseX, noseY, left_eyeX, left_eyeY);
//               // let mX = poses[0].pose.keypoints[0].position.x;
//               // let mY = poses[0].pose.keypoints[0].position.y + dm;
//               // mouseX = Math.dist(mouseX, mX, 0.5);
//               // mouseY = Math.dist(mouseY, mY, 0.5);
            
//           }
// }
export default loopThroughPoses;
