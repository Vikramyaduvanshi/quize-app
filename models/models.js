let mongoose=require("mongoose");



const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
});


let Usermodel= mongoose.model("User",Userschema)


let Topicschema= new mongoose.Schema({
    name:{type:String},
},
{timestamps:true}
)

let Topics= mongoose.model("Topic", Topicschema);

let questionschema= new mongoose.Schema({
topic:{type:String},
topicId:{type:mongoose.Schema.Types.ObjectId, ref:"Topic", required:true},
question:{type:String,required:true},
answer:{type:String, required:true},
difficulty:{type:String, enum:["hard","easy","midium"], required:true}
})

let Quizschema= new mongoose.Schema({

userid:{type:mongoose.Schema.Types.ObjectId, ref:"User", required:true},
attempQuestions: [
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    answerStatus: { type: String, enum: ["correct", "incorrect"], required: true }
  }
]
,  
score:{type:Number, default:0}


})
let Quizs= mongoose.model("Quiz", Quizschema)


let Questions= mongoose.model("Question", questionschema);


module.exports={Questions,Topics,Usermodel,Quizs}