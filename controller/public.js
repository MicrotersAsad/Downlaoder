const axios = require("axios");
require("dotenv").config();
const aufs = require("all-url-file-size");

exports.startApi = (req, res, next) => {
  res.status(200).json({ message: "Welcome To Vidown Api" });
};

exports.postYoutube = async (req, res, next) => {
  const ytUrl = req.body.urls;
  let videoId = ytUrl
    .replace("https://www.youtube.com/watch?v=", "")
    .replace("https://www.youtube.com/shorts/", "")
    .replace("https://youtu.be/", "")
    .replace("https://youtube.com/shorts/", "")
    .replace("https://www.youtube.com/live/", "")
    .slice(0, 11);

  console.log(videoId);

  const options = {
    method: "GET",
    url: "https://yt-api.p.rapidapi.com/dl",
    params: { id: videoId },
    headers: {
      "X-RapidAPI-Key": process.env.YT_API_KEY,
      "X-RapidAPI-Host": "yt-api.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    const result = response.data;

    if (result.thumbnail) {
      const dataList = result.formats.map((obj) => ({
        url: obj.url,
        quality: obj.qualityLabel,
        size: ((obj.bitrate * (+obj.approxDurationMs / 1000)) / (8 * 1024 * 1024)).toFixed(1),
      }));

      return res.status(200).json({
        thumb: result["thumbnail"][2].url,
        urls: dataList,
        title: result["title"],
      });
    } else {
      return res.status(403).json({
        status: "fail",
        error: "Sorry, we couldn't locate the video you're looking for. It's possible that the video is set to private or has been removed.",
        code: 403,
      });
    }
  } catch (error) {
    console.error(error);
    // Forward to centralized error handling
    next(error);
  }
};

exports.postTwitter = async (req, res, next) => {
  const twUrl = req.body.urls;
  let responseSent = false; // Flag to track if the response has been sent

  const options = {
    method: "POST",
    url: "https://twitter65.p.rapidapi.com/api/twitter/links",
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": process.env.TW_API_KEY,
      "X-RapidAPI-Host": "twitter65.p.rapidapi.com",
    },
    data: { url: twUrl },
  };

  try {
    const response = await axios.request(options);
    const data = response.data;
    let dataUrl = data[0].urls;

    // Handling multiple asynchronous operations with Promise.all
    const sizePromises = dataUrl.map(item => aufs(item.url, "MB"));
    const sizes = await Promise.all(sizePromises);

    const dataList = sizes.map((size, index) => ({
      url: dataUrl[index].url,
      quality: dataUrl[index].subName + "P",
      size: size.toFixed(1),
    }));

    if (!responseSent) { // Check if the response has already been sent
      res.status(200).json({
        thumb: data[0]["pictureUrl"],
        urls: dataList,
        title: data[0]["meta"]["title"],
      });
      responseSent = true; // Mark that the response has been sent
    }
  } catch (err) {
    if (!responseSent) { // Ensure no response has been sent before sending error response
      res.status(403).json({
        status: "fail",
        error: "Sorry, we couldn't locate the video you're looking for. It's possible that the video is set to private or has been removed.",
        code: 403,
      });
      responseSent = true;
    }
  }
};


exports.postFb = async (req, res, next) => {
  const fbUrl = req.body.urls;
  const options = {
    method: "GET",
    url: "https://fb-video-reels.p.rapidapi.com/api/getSocialVideo",
    params: { url: fbUrl },
    headers: {
      "X-RapidAPI-Key": process.env.FB_API_KEY,
      "X-RapidAPI-Host": "fb-video-reels.p.rapidapi.com",
    },
  };

  try {
    const response = await axios.request(options);
    const dataList = response.data;
    const format = dataList.links;

    if (dataList.error === true) {
      return res.status(403).json({
        status: "fail",
        error: "Sorry, we couldn't locate the video you're looking for. It's possible that the video is set to private or has been removed.",
        code: 403,
      });
    }

    const sizePromises = format.map(data => aufs(data.link, "MB"));
    const sizes = await Promise.all(sizePromises);

    const urls = sizes.map((size, index) => ({
      url: format[index].link,
      quality: format[index].quality.toUpperCase(),
      size: size.toFixed(1),
    }));

    res.status(200).json({
      thumb: dataList["picture"],
      urls: urls,
      title: dataList["description"],
    });

    try {
      const activityResult = await req.users.addActivity({ fbUrl: fbUrl });
      console.log(activityResult);
    } catch (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  } catch (err) {
    res.status(403).json({
      status: "fail",
      error: "Sorry, we couldn't locate the video you're looking for. It's possible that the video is set to private or has been removed.",
      code: 403,
    });
    const error = new Error(err);
    error.httpStatusCode = 403;
    return next(error);
  }
};

exports.otherPost = (req, res, next) => {
  const igUrl = req.body.urls;

  const options = {
    method: "GET",
    url: "https://fb-video-reels.p.rapidapi.com/api/getSocialVideo",
    params: {
      url: igUrl,
    },
    headers: {
      "X-RapidAPI-Key": process.env.IG_API_KEY,
      "X-RapidAPI-Host": "fb-video-reels.p.rapidapi.com",
    },
  };

  try {
    axios
      .request(options)
      .then((response) => {
        const formats = response.data;
        const videData = formats.links;

        if (formats.error === true) {
          return res.status(403).json({
            status: "fail",
            error:
              "Sorry, we couldn't locate the video you're looking for. It's possible that the video is set to private or has been removed.",
            code: 403,
          });
        }

        const urls = [];

        videData.forEach((data) => {
          aufs(data.link, "MB")
            .then((size) => {
              urls.push({
                url: data.link,
                quality:
                  data.quality.length > 1 ? data.quality.toUpperCase() : "720P",
                size: size.toFixed(1),
              });
            })
            .then((result) => {
              if (urls.length === videData.length) {
                res.status(200).json({
                  thumb: formats.picture,
                  urls: urls,
                  title: "Your IG Videos",
                });
                req.users
                  .addActivity({ igUrl: igUrl })
                  .then((result) => {
                    console.log("OK");
                  })
                  .catch((err) => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                  });
              }
            });
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(403).json({
          status: "fail",
          error:
            "Sorry, we couldn't locate the video you're looking for. It's possible that the video is set to private or has been removed.",
          code: 403,
        });

        const error = new Error(err);
        error.httpStatusCode = 403;
        return next(error);
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "fail",
      error: "An unexpected error occurred. Please try again later.",
      code: 500,
    });
    const err = new Error(error);
    err.httpStatusCode = 500;
    return next(err);
  }
};
