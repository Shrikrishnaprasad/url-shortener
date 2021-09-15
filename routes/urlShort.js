const router = require("express").Router();
const UrlShort = require("../models/UrlShort");

//getAll urls
router.get("/", async (req, res) => {
  try {
    const urls = await UrlShort.find();
    res.status(200).json(urls);
  } catch (error) {
    res.status(500).json(error);
  }
});

//get url by id
router.get("/shortUrl/:urlId", async (req, res) => {
  try {
    const url = await UrlShort.findOne({ shortUrl: req.params.urlId });
    if (url) {
      const urlData = await UrlShort.findByIdAndUpdate(
        { _id: url.id },
        { $inc: { clickCount: 1 } },
        { new: true }
      );
      res.status(200).json(urlData.longUrl);
    } else {
      res.status(500).json("Url is not found");
    }

    //res.status(200).json(urls);
  } catch (error) {
    res.status(500).json(error);
  }
});

//get url count by month wise
router.get("/urlCount", async (req, res) => {
  try {
    const data = await UrlShort.aggregate([
      {
        $project: {
          month: { $month: "$createdAt" },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json(error);
  }
});

//create url
router.post("/create", async (req, res) => {
  const newUrl = new UrlShort({
    longUrl: req.body.longUrl,
    shortUrl: generateUrl(),
  });
  try {
    const savedUrl = await newUrl.save();
    res.status(201).json(savedUrl);
  } catch (err) {
    res.status(500).json(err);
  }
});

function generateUrl() {
  let rndResult = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789";
  let charLen = characters.length;
  for (let i = 0; i < 5; i++) {
    rndResult += characters.charAt(Math.floor(Math.random() * charLen));
  }
  return rndResult;
}
module.exports = router;
