let express = require("express");
let userRouter = express.Router();
const bcrypt = require('bcrypt');
let mongoose= require("mongoose")
var jwt = require('jsonwebtoken');
let { Usermodel, Topics, Questions, Quizs } = require("../models/models.js");
const quizmiddle = require("../middleware/middleware.js");

let quizrouter = express.Router();
let questionrouter = express.Router();
let tpoicrouter = express.Router();


userRouter.post("/signup", async (req, res) => {
  let { email, password,role } = req.body;
  let myPlaintextPassword = password;


  
  const saltRounds = 10;

  bcrypt.hash(myPlaintextPassword, saltRounds, async function (err, hash) {
    if (err) {
      
      return res.status(500).json({ message: "Hashing failed", error: err.message });
    } else {
      let newuser = new Usermodel({ email, password: hash,role});
      await newuser.save();
      res.json({ message: "success" });
    }
  });
});


userRouter.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;
    let myPlaintextPassword = password;
    let user = await Usermodel.findOne({email});

    if (!user) {
      return res.json({ message: "user not found" });
    } else {
      let hash = user.password;

      bcrypt.compare(myPlaintextPassword, hash, function (err, result) {
        if (err) {
          res.status(500).json({ message: "error occurred", error: err.message });
        } else {
          if (result) {
            var accesstoken = jwt.sign({ userId: user._id, role: user.role }, 'shhhhh', { expiresIn: 300 });
            var refreshtoken = jwt.sign({ userId: user._id, role: user.role }, 'shhhhh', { expiresIn: "7d" });
            res.json({ message: "login success", accesstoken, refreshtoken,role:user.role});
          } else {
            res.json({ message: "wrong password" });
          }
        }
      });
    }
  } catch (e) {
    res.json({ message: "error occurred", error: e.message });
  }
});

userRouter.get("/totalUsers",quizmiddle("admin"), async (req,res)=>{
try{
let {page=1,limit=6,email}= req.query
let checkemail={role:{$ne:"admin"}}

if(email){
checkemail.email={$regex:email,$options:"i"}
}
let fulldetails= await Usermodel.aggregate([{$match: checkemail},{$lookup:{from:"quizzes", localField:"_id", foreignField:"useid", as:"quizes"}},{$project:{"password":0 , "__v":0,"role":0}}]).skip((page-1)*limit).limit(Number(limit))
res.json({success:true, TotalUser:fulldetails, noOfUser:fulldetails.length})
}
catch(e){
res.json({success:false, message:e.message,route:'userdetails'})
}

})

userRouter.delete("/:id",quizmiddle("admin"),async(req,res)=>{
try{
  let id= req.params.id;
  let user= await Usermodel.findById(id)
  if(!user) return res.json({success:false, message:"user not found"})
await Usermodel.findByIdAndDelete(id)

res.json({success:true, message:"deleted succesfully"})
}catch(e){
res.json({success:false, message:e.message})
}
})

tpoicrouter.post("/", quizmiddle("admin"), async (req, res) => {
  try {
    let newtopic = new Topics(req.body);
    await newtopic.save();
    res.json({ success: true, message: "topic created successfully" });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});


tpoicrouter.get("/", async (req, res) => {

  try {
    
    let list = await Topics.find(); 
    res.json({ success: true, message: "topic list", topiclist: list });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});


questionrouter.post("/:topicId", quizmiddle("admin"), async (req, res) => {
  let id = req.params.topicId;
  try {
    let topic= await Topics.findById(id);
    let name=topic.name
    let newquestion = new Questions({
      ...req.body,
      topicId: id,
      topic:name
    });
    await newquestion.save();
    res.json({ success: true, message: "question added successfully" }); 
  } catch (e) {
    res.json({ success: false, message: e.message }); 
  }
});

questionrouter.get("/allquestions", async (req, res) => {

 try{
   let {page=1, limit=15,difficulty,topic}=req.query
let filterby={}
if(difficulty){
  filterby.difficulty={$regex:difficulty, $options:"i"}
}
if(topic){
  filterby.topic={$regex:topic, $options:"i"}
}
let total= await Questions.countDocuments()
let skip= (Number(page)-1)*Number(limit)
let data=await Questions.aggregate([{$match:filterby},{$skip:skip}, {$limit:Number(limit)},{$project:{"__v":0, "_id":0, "topicId":0}}])
res.json({success:true,total:total, data:data, message:'fetched successfully'})
 }
catch(e){
res.json({success:false, message:e.message})
}
});

quizrouter.get("/", async (req, res) => {
  const { difficulty } = req.query;

  if (!difficulty || !["easy", "midium", "hard"].includes(difficulty)) {
    return res.status(400).json({ message: "Invalid or missing difficulty level" });
  }

  try {
    const topics = await Topics.find();
    let finalQuestions = [];

    for (const topic of topics) {
      const topicQuestions = await Questions.aggregate([ 
        { $match: { topicId: topic._id, difficulty } },
        { $sample: { size: 2 } }
      ]);

      finalQuestions.push(...topicQuestions);
    }

    res.json(finalQuestions);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
});

quizrouter.post("/addquize",quizmiddle("user","admin") ,async (req, res) => {
  
  let { attempQuestions } = req.body;
  let score = 0;
  if(!attempQuestions){
res.json({success:false, message:"quize is get in backend"})
  }
console.log(attempQuestions)
  attempQuestions.forEach((v) => {
    if (v.answerStatus === "correct") {
      score++;
    }
  });

  try {
    let newquiz = new Quizs({ attempQuestions, score, userid: req.user });
    await newquiz.save();
    res.json({ success: true, message: "quiz submitted successfully" });
  } catch (e) {
    res.json({ success: false, message: e.message });
  }
});


quizrouter.get("/quize/:quizId", async(req,res)=>{

try{
  let id= req.params.quizId
let quiz=await Quizs.aggregate([{$match:{_id:new mongoose.Types.ObjectId(id)}},{$unwind:"$attempQuestions"}, {$lookup:{from:"questions", localField:"attempQuestions.questionId", foreignField:"_id", as:"questiondetails"}},{$project:{questiondetails:1,_id:0}}])

let result= quiz.map((v)=>{
  let {question,answer,difficulty}=v.questiondetails[0]
  return {
    question:question,
    answer:answer,
    difficulty:difficulty

  }
})

res.json({success:true, quize: result, message:"fetched successfully"})
}catch(e){
  res.json({success:false, message:e.message})
}
})  

quizrouter.get("/userqize", quizmiddle("user", "admin"), async (req, res) => {
  try {
    const id = new mongoose.Types.ObjectId(req.user);

    const quizes = await Quizs.aggregate([
      { $match: { userid: id } }, // match user
      { $unwind: "$attempQuestions" }, // break array
      {
        $lookup: {
          from: "questions", // make sure it's lowercase and plural
          localField: "attempQuestions.questionId",
          foreignField: "_id",
          as: "questionInfo"
        }
      },
      { $unwind: "$questionInfo" }, // flatten questionInfo array
      {
        $group: {
          _id: "$questionInfo.topic", // group by topic
          total: { $sum: 1 },
          correct: {
            $sum: {
              $cond: [{ $eq: ["$attempQuestions.answerStatus", "correct"] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          percentage: {
            $round: [{ $multiply: [{ $divide: ["$correct", "$total"] }, 100] }, 2]
          }
        }
      }
    ]);

    res.json({ success: true, data: quizes });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});




module.exports = {
  userRouter,
  quizrouter,
  tpoicrouter,
  questionrouter
};
