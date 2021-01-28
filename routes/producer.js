var express = require('express');
const app = require('../app');
var router = express.Router();
var Anime_info = require("../models/Anime_info");
var Country = require("../models/Country");

const sharp = require('sharp');
const multer = require('multer');

var fs = require('fs');
const mkdirp = require('mkdirp');
const path = require("path");

/* GET home page. */
// Index
router.get("/", function (req, res) {
  Anime_info.find({})
    .exec(function (err, posts) {
      if (err) return res.json(err);
      res.render("producer/index", { posts: posts });
    });
});

// New
router.get("/new", function (req, res) {
  Country.find({})
    .exec(function (err, countries) {
      if (err) return res.json(err);
      //console.log(countries);
      res.render("producer/new", { countries: countries });
    });

});




const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image") || file.mimetype.startsWith("video")) {
    //console.log(file);
    //console.log("image files");
    cb(null, true);
  }
  else {
    console.log("not image files");
    cb("Please upload only images.", false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: multerFilter,
  limits: { fileSize: 100 * 1024 * 1024 }//10mb 제한
});

/*const uploadFiles = upload.single("file");//file이라는 이름을 가진 곳에서 하나만 업로드 가능
const uploadFile = upload.array("file", 10);//10개까지 가능*/
/*{
  name: 'video', maxCount: 1
}*/

const uploadField = upload.fields([{ name: 'opfile' }, { name: 'enfile' }, { name: 'coverimg' }, { name: 'stealcut' }]);
//const uploadField = upload.fields([{ name: 'file' }]);

const uploadImages = (req, res, next) => {
  uploadField(req, res, err => {
    //console.log(req);
    //console.log(err);
    //console.log(res);
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        //return res.send("Too many files to upload.");
        console.log(err);
        return res.json({ response: { resultCode: 0, message: "파일을 너무 많이 올렸습니다" } });
      }
    }
    else if (err) {
      return res.json({ response: { resultCode: 0, message: "파일을 올리는 중 오류가 발생했습니다." } });
    }
    next();
  });
};

const srcFolder = "/upload/anime";
const uploadFolder = "./public" + srcFolder;


const resizeImages = async (req, res, next) => {

  if (!req.files) return next();

  //req.body.images = [];
  //console.log("req.files : " + req.files);
  for (key in req.files) {
    var filearray = [];
    await Promise.all(
      req.files[key].map(async file => {
        //console.log("file : " + file);
        //console.log("req.file : " + req.file);
        //console.log(file.originalname);;
        //console.log(file);
        //const filename = file.originalname.lastIndexOf('.');
        
        const originalname = file.originalname;
        //console.log(originalname.lastIndexOf('.'));
        const filename = path.basename(originalname);
        const ext = path.extname(originalname);
        //const filename = file.originalname.replace(/\..+$/, "");
        //const ext = file.originalname.replace(/(\w|-)+./, '');
        //const newFilename = `${filename}-${Date.now()}.${ext}`;
        const newFilename = `${Date.now()}${ext}`;
        const filepath = `${uploadFolder}/${newFilename}`;
        const size = file.size;
        //console.log(filepath);
        const src = `${srcFolder}/${newFilename}`;
        //console.log(file.buffer);
        var filejson = {
          originalname: originalname,
          filename: filename,
          newfilename: newFilename,
          ext: ext,
          filepath: filepath,
          src: src,
          size: size
        }
        //mkdirp('/tmp/foo/bar/baz').then(made => console.log(`made directories, starting with ${made}`));      
        fs.mkdir(uploadFolder, { recursive: true }, (err) => {
          sharp(file.buffer)
            //.resize(640, 320)
            .resize({ height: 400 })
            .toFormat("jpeg")
            .jpeg({ quality: 90 })
            .toFile(`${uploadFolder}/${newFilename}`)
            .catch(err => {
              console.log(err);
              return ({ response: { resultCode: 0, message: "파일을 올리는 중 오류가 발생했습니다." } });
            })
        })
        /*mkdirp(uploadFolder).then(made => {
            console.log(made);
        })*/
        filearray.push(filejson);
      })
    );
    console.log(filearray);
    //Object.assign(req.body[key], filearray);
    req.body[key] = filearray;
  }
  //req.body.test = "test";
  next();
};

const saveImages = async (req, res, next) => {
  if (!req.file) return next();
  var image_array = [];
  req.body.image = null;

  const filename = req.file.originalname.replace(/\..+$/, "");
  const ext = req.file.originalname.replace(/(\w|-)+./, '');
  const newFilename = `${filename}-${Date.now()}.${ext}`;
  const json = {
    //img_src: uploadFolder + newFilename,
    img_src: srcFolder + newFilename,
    img_original: req.file.originalname,
    img_name: newFilename,
    img_ext: ext
  }
  fs.writeFile(`${uploadFolder}/${newFilename}`, req.file.buffer, 'binary', function (err) {
    if (err) {
      console.log(err);
    }
  });
  image_array.push(json);

  req.body.image = json;
  next();
};

//resizeImages나 saveImages 중 하나만 사용할 것.

const getResult = async (req, res, next) => {
  if (req.file && req.body.image == null) {
    res.json({ response: { resultCode: 0, message: "파일이 업로드되지 않았습니다" } });
  }
  else {
    next();
  }
};

router.get('/test', function (req, res) {
  res.render('anime/upload_test');
});

router.post('/img_upload', uploadImages, saveImages, getResult, function(req,res) {
  res.json({code:1, respnse:"성공"});
});

// create
router.post("/", uploadImages, resizeImages, getResult, function (req, res) {

  var title_json = {};
  title_json.ko = req.body.titleko;
  if (req.body.titlejp) {
    title_json.jp = req.body.titlejp;
  }
  if (req.body.titleromi) {
    title_json.jp_romi = req.body.titleromi;
  }
  req.body.title = title_json;

  var opening_json = {};
  var opening_array = [];
  for(var i=0; i<req.body.opnum; i++) {
    if(req.body.opurl[i]) {
      opening_json.url = req.body.opurl[i];
    } else {
      opening_json.file = req.body.opfile[i];
    }
    opening_json.title = req.body.optitle[i];
    opening_json.startep = req.body.OPrange_start;
    opening_json.endep = req.body.OPrange_end;
    opening_array.push(opening_json);
  }
  req.body.opening = opening_array;


  var ending_json = {};
  var ending_array = [];
  for(var i=0; i<req.body.ednum; i++) {
    if(req.body.edurl[i]) {
      ending_json.url = req.body.edurl[i];
    } else {
      ending_json.file = req.body.edfile[i];
    }
    ending_json.title = req.body.edtitle[i];
    ending_json.startep = req.body.EDrange_start;
    ending_json.endep = req.body.EDrange_end;
    ending_array.push(ending_json);
  }
  req.body.ending = ending_array;


  console.log(req.body);

  Anime_info.create(req.body, function (err, post) {
    if (err) {
      return res.redirect("/anime/new");
    }
    res.redirect("/anime");
  });
});

router.get('/ttest', function (req, res, next) {
  res.render('ttest');
});

router.get('/test', function (req, res, next) {
  res.render('anime/test');
});

router.post('/posttest', function (req, res, next) {
  console.log(req.body);
});

router.get("/removeall", function(req,res) {
  Anime_info.remove({}, function(err) {
    if (err) console.log(true);
    console.log(true);
    res.json({text:"성공"});
  })
})

// show
router.get("/:id", function (req, res) {
  Anime_info.findOne({ _id: req.params.id })
    .populate("author")
    .exec(function (err, post) {
      if (err) return res.json(err);
      res.render("anime/view", { post: post });
    });
});

// edit
router.get("/:id/edit", function (req, res) {
  Anime_info.findOne({ _id: req.params.id }, function (err, post) {
    if (err) return res.json(err);
    res.render("anime/edit");
  });
});

// update
router.put("/:id", function (req, res) {
  req.body.updatedAt = Date.now();
  Anime_info.findOneAndUpdate({ _id: req.params.id }, req.body, { runValidators: true }, function (err, post) {
    if (err) {

      return res.redirect("/anime/" + req.params.id + "/edit");
    }
    res.redirect("/anime/" + req.params.id);
  });
});

// destroy
router.delete("/:id", function (req, res) {
  Anime_info.deleteOne({ _id: req.params.id }, function (err) {
    if (err) return res.json(err);
    res.redirect("/anime");
  });
});


module.exports = router;
