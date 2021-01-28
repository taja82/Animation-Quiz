const sharp = require('sharp');
const multer = require('multer');

var fs = require('fs');
const mkdirp = require('mkdirp');
const path = require("path");

const multerFilter = (req, file, cb) => {
  console.log(file.mimetype);
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
//const uploadField = upload.fields([{ name: 'file', maxCount: 10 }]);

const uploadImages = (req, res, next) => {
  //console.log(req.file);
  uploadField(req, res, err => {
    //console.log(req.files);
    if (err instanceof multer.MulterError) {
      console.log(err);
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        //return res.send("Too many files to upload.");
        return res.json({ response: { resultCode: 0, message: "파일을 너무 많이 올렸습니다" } });
      }
    }
    else if (err) {
      return res.json({ response: { resultCode: 0, message: "파일을 올리는 중 오류가 발생했습니다." } });
    }
    next();
  });

};
const publicfolder = "./public";
const uploadRoot = "/upload"//업로드 루트
let uploadMidFolder;//중간 구분//게시판 구분용
let uploadFolder = uploadRoot;//없으면 그냥 /upload에 저장시킴
const uploadSeperateMode = true;
//true일 경우 각각 name별로 폴더를 만들어서 저장을 하고, false일 경우 한군데에 몰아서 저장함.

function getUploadMidFolder() {
  return uploadMidFolder;
};

function setUploadMidFolder(uploadMidFolder) {
  this.uploadMidFolder = uploadMidFolder;
  if (uploadMidFolder) {
    uploadFolder += "/" + uploadMidFolder;//중간에 게시판 이름 추가
  }
}

const resizeImages = async (req, res, next) => {
  //console.log(req.file);
  //console.log(req.files)
  //console.log(req);
  if (!req.files) {
    return next()
  };

  //req.body.images = [];
  //console.log("req.files : " + req.files);
  for (key in req.files) {
    //console.log(key);
    var filearray = [];
    await Promise.all(
      req.files[key].map(async file => {
        //console.log("fileaaa : " + file);
        //console.log("req.file : " + req.file);
        //console.log(file.originalname);;
        //console.log(file);

        const originalname = file.originalname;
        const filename = path.basename(originalname);
        const ext = path.extname(originalname);
        const newFilename = `${Date.now()}${ext}`;

        //업로드 될 곳이 많다 보니까 name별로 폴더 나눌것
        //예를 들어 /upload/anime/coverimg
        //upload/anime/stealcut

        const filepath = `${uploadFolder}/${key}`;

        if (!uploadSeperateMode) {
          filepath = `${uploadFolder}`;
        }

        const filesavepath = `${filepath}/${newFilename}`;

        const size = file.size;
        //console.log(filepath);
        //const src = `${srcFolder}/${newFilename}`;

        var filejson = {
          originalname: originalname,
          filename: filename,
          newfilename: newFilename,
          ext: ext,
          src: filesavepath,
          size: size,
        }
        //console.log(filejson);
        //이 resizeimages 미들웨어와 아래에 있는 saveimage를 합치려고 하는데, 지금 생각난 방법은 여기서 sharp로 줄인 후에 버퍼로만 출력하고 saveimage 미들웨어에서는 이 버퍼를 이미지로 저장하는 방식으로..
        //fs.mkdirSync(uploadFolder, {recursive: true});
        //mkdirp('/tmp/foo/bar/baz').then(made => console.log(`made directories, starting with ${made}`));      
        console.log(key);
        fs.mkdir(filepath, { recursive: true }, (err) => {
          sharp(file.buffer)
            //.resize(640, 320)
            .resize({ height: 400 })
            .toFormat("jpeg")
            .jpeg({ quality: 90 })
            .toFile(publicfolder + filesavepath)
            .then(data => {
              //console.log(true);
            })
            .catch(err => {
              console.log(err);
              return ({ response: { resultCode: 0, message: "파일을 올리는 중 오류가 발생했습니다." } });
            })
        })
        /*sharp(file.buffer)
        .resize({height:400})
        .toFormat("jpeg")
        .toBuffer()
        .then( data => {
          filearray.push(filejson);
          next();
        })
        .catch(err=> {
          console.log(err);
          return ({ response: { resultCode: 0, message: "파일을 올리는 중 오류가 발생했습니다." } });
        });
        next();*/
        /*mkdirp(uploadFolder).then(made => {
            console.log(made);
        })*/
        filearray.push(filejson);
        if(filearray.length>1) {
          req.body[key] = filearray;
        } else {
          req.body[key] = filejson;
        }
        
      })
    );
    //console.log(filearray);
    //console.log(req.body);

    //Object.assign(req.body[key], filearray);
    //console.log(req.body);
  }
  console.log(req.body);
  next();
};
//파일 업로드 방식이
//한개씩 업로드와, 전체 업로드가 있는데
//두 방식을 전체 다 충족시키기 위해서는,
//마지막 미들웨어에서 받아온것들 합쳐서 저장해야할듯
//아니면 말고. 잘되면 말고


//saveImages 이 미들웨어는 수정이 안되었기 때문에, 업로드가 하나밖에 안될것임. 아마도
const saveImages = async (req, res, next) => {
  if (!req.files) return next();
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
  //console.log(!req.file);
  //console.log(req.file);
  //console.log(!req.files)
  if (req.file && req.body.image) {
    return res.json({ response: { resultCode: 0, message: "파일이 업로드되지 않았습니다" } });
  }
  else {
    next();
  }
};

module.exports = {
  getUploadMidFolder: getUploadMidFolder,
  setUploadMidFolder: setUploadMidFolder,
  //getUploadedFile : getUploadedFile,
  uploadImages: uploadImages,
  resizeImages: resizeImages,
  saveImages: saveImages,
  getResult: getResult
}