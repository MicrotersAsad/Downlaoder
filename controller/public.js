const axios = require("axios");
require("dotenv").config();
const aufs = require("all-url-file-size");

exports.startApi = (req, res, next) => {
  res.status(200).json({ message: "Welcome To downloader Api" });
};

// exports.postYoutube = async (req, res, next) => {
//   const ytUrl = req.body.urls;
//   let videoId = ytUrl
//     .replace("https://www.youtube.com/watch?v=", "")
//     .replace("https://www.youtube.com/shorts/", "")
//     .replace("https://youtu.be/", "")
//     .replace("https://youtube.com/shorts/", "")
//     .replace("https://www.youtube.com/live/", "")
//     .slice(0, 11);

//   console.log(videoId);

//   const options = {
//     method: "GET",
//     url: "https://yt-api.p.rapidapi.com/dl",
//     params: { id: videoId },
//     headers: {
//       "X-RapidAPI-Key": process.env.YT_API_KEY,
//       "X-RapidAPI-Host": "yt-api.p.rapidapi.com",
//     },
//   };

//   try {
//     const response = await axios.request(options);
//     const result = response.data;

//     if (result.thumbnail) {
//       const dataList = result.formats.map((obj) => ({
//         url: obj.url,
//         quality: obj.qualityLabel,
//         size: ((obj.bitrate * (+obj.approxDurationMs / 1000)) / (8 * 1024 * 1024)).toFixed(1),
//       }));

//       return res.status(200).json({
//         thumb: result["thumbnail"][2].url,
//         urls: dataList,
//         title: result["title"],
//       });
//     } else {
//       return res.status(403).json({
//         status: "fail",
//         error: "Sorry, we couldn't locate the video you're looking for. It's possible that the video is set to private or has been removed.",
//         code: 403,
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     // Forward to centralized error handling
//     next(error);
//   }
// };





exports.postTwitter = async (req, res, next) => {
  const twUrl = req.body.urls;
  console.log(twUrl);

  const options = {
    method: "GET",
    url: 'https://twitter-downloader-download-twitter-videos-gifs-and-images.p.rapidapi.com/status',
    params: { url: twUrl },
    headers: {
      "X-RapidAPI-Key": process.env.TW_API_KEY,
      'X-RapidAPI-Host': 'twitter-downloader-download-twitter-videos-gifs-and-images.p.rapidapi.com',
    },
  };

  try {
    const response = await axios.request(options);
    const data = response.data;
    console.log(data);

    // Check if the response contains video URL
    if (!data.media || !data.media.video || !data.media.video.videoVariants) {
      return res.status(404).json({ error: 'Video not found in the tweet.' });
    }

    const videoVariants = data.media.video.videoVariants;
    const videoUrls = videoVariants.map(variant => ({
      url: variant.url,
      quality: 'High', // You can set quality dynamically based on variant.bitrate if available
      size: 'Unknown' // You can set size dynamically based on variant.size if available
    }));

    // Respond with the extracted data
    res.status(200).json({
      thumb: data.user.profile, // Assuming this is the profile image
      urls: videoUrls,
      title: data.description,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};





//Facebook videos Downloder

exports.postFb = async (req, res, next) => {
  const fbUrl = req.body.urls;
console.log(fbUrl);

  const options = {
    method: "GET",
    url: "https://fb-video-reels.p.rapidapi.com/smvd/get/all",
    params: { url: fbUrl },
    headers: {
      "X-RapidAPI-Key": process.env.FB_API_KEY,
      "X-RapidAPI-Host": "fb-video-reels.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    const data = response.data;
   

    // Check if the API call was successful
    if (!data.success) {
      // Assuming an error property contains error details
      return res.status(403).json({
        status: "fail",
        error: "Unable to process your request at this time.",
        code: 403,
      });
    }

    // Assuming links is an array of objects { quality, link }
    // Use Promise.all to wait for all size calculations
    const videoLinks = await Promise.all(data.links.map(async (video) => {
      const size = await aufs(video.link, "MB"); // Assuming aufs is a function that returns a Promise with the size
      return {
        quality: video.quality.toUpperCase(),
        url: video.link,
        size: size.toFixed(1), // Assuming size is a number
      };
    }));

    res.status(200).json({
      thumb: data.picture,
      urls: videoLinks,
      title: data.title,
    });

  } catch (error) {

    // Forward to centralized error handling
    next(error);
  }
};



// exports.otherPost = (req, res, next) => {
//   const igUrl = req.body.urls;

//   const options = {
//     method: "GET",
//     url: "https://fb-video-reels.p.rapidapi.com/smvd/get/all",
//     params: {
//       url: igUrl,
//     },
//     headers: {
//       "X-RapidAPI-Key": process.env.IG_API_KEY,
//       "X-RapidAPI-Host": "fb-video-reels.p.rapidapi.com",
//     },
//   };

//   try {
//     axios
//       .request(options)
//       .then((response) => {
//         const formats = response.data;
//         const videData = formats.links;

//         if (formats.error === true) {
//           return res.status(403).json({
//             status: "fail",
//             error:
//               "Sorry, we couldn't locate the video you're looking for. It's possible that the video is set to private or has been removed.",
//             code: 403,
//           });
//         }

//         const urls = [];

//         videData.forEach((data) => {
//           aufs(data.link, "MB")
//             .then((size) => {
//               urls.push({
//                 url: data.link,
//                 quality:
//                   data.quality.length > 1 ? data.quality.toUpperCase() : "720P",
//                 size: size.toFixed(1),
//               });
//             })
//             .then((result) => {
//               if (urls.length === videData.length) {
//                 res.status(200).json({
//                   thumb: formats.picture,
//                   urls: urls,
//                   title: "Your IG Videos",
//                 });
//                 req.users
//                   .addActivity({ igUrl: igUrl })
//                   .then((result) => {
//                     console.log("OK");
//                   })
//                   .catch((err) => {
//                     const error = new Error(err);
//                     error.httpStatusCode = 500;
//                     return next(error);
//                   });
//               }
//             });
//         });
//       })
//       .catch((err) => {
//         console.log(err);
//         res.status(403).json({
//           status: "fail",
//           error:
//             "Sorry, we couldn't locate the video you're looking for. It's possible that the video is set to private or has been removed.",
//           code: 403,
//         });

//         const error = new Error(err);
//         error.httpStatusCode = 403;
//         return next(error);
//       });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       status: "fail",
//       error: "An unexpected error occurred. Please try again later.",
//       code: 500,
//     });
//     const err = new Error(error);
//     err.httpStatusCode = 500;
//     return next(err);
//   }
// };
