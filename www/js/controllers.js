angular.module('starter.controllers', [])

.controller('DashCtrl', function(
  $scope,
  $http
) {
  'use strict';

  var API_URL = 'https://fathomless-waters-7569.herokuapp.com/api';
  $scope.status = 'Ready to upload!';

  function uploadImage(imageURI, fileName) {

    console.log('Retrieving S3 policy from backend ...');
    $scope.status = 'Retrieving S3 policy ...';
    $scope.$apply();
    $http.get(API_URL + '/s3Policy')
      .success(function(s3Config) {
        var ft = new FileTransfer();
        var options = new FileUploadOptions();

        options.fileKey = 'file';
        options.fileName = 'rnd' + fileName;
        options.mimeType = 'image/jpeg';
        options.httpMethod = 'POST';
        options.params = {
          'key': fileName,
          'AWSAccessKeyId': s3Config.awsAccessKeyId,
          'acl': s3Config.acl,
          'policy': s3Config.policy,
          'signature': s3Config.signature,
          'Content-Type': 'image/jpeg'
        };
        options.headers = {
          Connection: 'close'
        };
        options.chunkedMode = false;

        console.log('ImageURI: ' + imageURI);
        console.log('Upload URI: ' + s3Config.url);
        console.log('Options: ' + JSON.stringify(options));

        $scope.status = 'Uploading ...';
        $scope.$apply();

        // FAILS: code=3 -> Seems the request does not even go through
        ft.upload(imageURI, s3Config.url,
        // WORKS: Upload to heroku server.
        // ft.upload(imageURI, 'https://fathomless-waters-7569.herokuapp.com/file-upload',
          function(e) {
            if (e.responseCode === 204) {
              $scope.status = 'Uploaded!';
            } else {
              $scope.status = 'Response Code != 200; Error: ' + JSON.stringify(e);
              console.log(JSON.stringify(e));
            }
            $scope.$apply();
          },
          function(e) {
            console.log(JSON.stringify(e));
            $scope.status = 'Error: ' + JSON.stringify(e);
            $scope.$apply();
          }, options, true);
      })
      .error(function(data) {
        $scope.status = 'Error: ' + JSON.stringify(data);
        $scope.$apply();
      });
  }

  $scope.userProfilePictureClicked = function() {
    if (window.platform === 'Web') {
      alert('Not supported on web');
      return;
    }
    window.imagePicker.getPictures(
      function(results) {
        if (!results || results.length < 1) {
          return;
        }
        var fileURI = results[0];

        window.resolveLocalFileSystemURI(fileURI, function(fileEntry) {
          fileEntry.file(function(fileObj) {
            var filePath = fileObj.localURL;
            var fileName = filePath.substr(filePath.lastIndexOf('/') + 1);
            // var fileName = results[0].replace(/^.*[\\\/]/, '');
            uploadImage(filePath, fileName);
          });
        });
      },
      function(error) {
        console.error('Error on window.imagePicker.getPictures(): ',
          error);
      }, {
        maximumImagesCount: 1,
        width: 600,
        height: 600,
        quality: 85
      }
    );
  };
});