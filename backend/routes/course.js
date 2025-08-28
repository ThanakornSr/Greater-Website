import { PrismaClient } from "@prisma/client";
import express from "express";
import Joi from 'joi';
import verifyToken from '../middleware/token.js'


const prisma = new PrismaClient();
const router = express.Router();

import upload from "../middleware/multer.js";

// get all course
router.get("/", async (req, res, next) => {
  try {
    const course = await prisma.course.findMany({
      include: {
        category: true,
        enrolled: true,
      },
      orderBy: {
        createAt: "desc",
      },
    });
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// get course by id
router.get("/:course_id", async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: {
        course_id: req.params.course_id,
      },
      include: {
        category: true,
        enrolled: true,
      },
    });
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// get Random Course
const getRanSchema = Joi.object({
  amount: Joi.string().required().regex(/^\d+$/).error(new Error('กรอกข้อมูลผิดพลาด')),
})
router.get("/randomCourse/:amount", async (req, res, next) => {
  const { error, value } = getRanSchema.validate(req.params)
  if(error){
    return res.status(400).json({message: error.message})
  }
  try {
    let course = [];
    const randomf = (values) => {
      const index = Math.floor(Math.random() * values.length);
      return values[index];
    };
    const orderBy = randomf([
      "course_id",
      "category_id",
      "description",
      "info",
      // "price",
      // "level",
      // "certificate",
      // "lesson",
      // "amount",
      // "start_date",
      // "end_date",
      // "create_date",
    ]);
    const orderDir = randomf(["asc", "desc"]);
    course = await prisma.course.findMany({
      include: {
        category: true,
        enrolled: true,
      },
      take: parseInt(req.params.amount),
      orderBy: { [orderBy]: orderDir },
    });
    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const convertToBoolean = (value) => {
  if (value === "false") {
    return false;
  } else {
    return Boolean(value);
  }
}


// create course
const createCourseSchema = Joi.object({
  title: Joi.string().required(),
  category_id: Joi.string().required(),
  description: Joi.string().required().min(10).max(200),
  info: Joi.string().required().min(80),
  price: Joi.number().required(),
  level: Joi.string().required(),
  certificate: Joi.boolean().required(),
  lesson: Joi.number().required(),
  amount: Joi.number().required(),
  start_date: Joi.alternatives().conditional('end_date', {
    then: Joi.date()
  }),
  end_date: Joi.date().min(Joi.ref('start_date')),
})
router.post("/createCourse", verifyToken, upload.single("fileupload"), async (req, res, next) => {
  const { error, value } = createCourseSchema.validate(req.body, { abortEarly: true})
  if(error){
    return res.status(400).json({message: error.message})
  }
  const course_image = req.file ? req.file.filename : null
  const { title, category_id, description, info, price, level, certificate, lesson, amount, start_date, end_date } =
    req.body;

  try {

    const course = await prisma.course.create({
      data: {
        title: title,
        category_id: category_id,
        description: description,
        info: info,
        price: Number(price),
        level: level,
        certificate: convertToBoolean(certificate),
        lesson: Number(lesson),
        amount: Number(amount),
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        course_image: course_image,
      },
    });
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// enroll new course

router.post("/enroll/:course_id", verifyToken, async (req, res) => {
  const { user_id } = req.body;
  try {
    const enroll = await prisma.enroll.create({
      data: {
        user_id: user_id,
        course_id: req.params.course_id,
        enroll_date: new Date(),
      },
    });
    res.status(200).json(enroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// get all enroll
router.get("/getEnrolled/all", async (req, res) => {
  try {
    const getEnroll = await prisma.enroll.findMany({
    });
    res.status(200).json(getEnroll);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// get all student Course Enrolled
router.get("/getEnrolled/:user_id", async (req, res) => {
  try {
    const getCourse = await prisma.enroll.findMany({
      where: {
        user_id: req.params.user_id,
      },
      include: {
        course: {
          include: {
            category: true,
            enrolled: true,
          },
        },
      },
    });
    res.status(200).json(getCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// get all enrolled by student id and course_id
router.get("/getEnrolledCourse/by/", async (req, res) => {
  const {user_id, course_id} = req.query
  try {
    const getCourse = await prisma.enroll.findMany({
      where: {
        AND: [
          {user_id: user_id},
          {course_id: course_id}
        ]
      },
    });
    res.status(200).json(getCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete Course
router.delete("/deleteCourse/:course_id", verifyToken, async (req, res) => {
  try {
    const deleteCourse = await prisma.course.delete({
      where: {
        course_id: req.params.course_id,
      },
    });
    res.status(200).json(deleteCourse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const updateCourseSchema = Joi.object({
  course_id: Joi.string().required(),
  title: Joi.string().required(),
  category_id: Joi.string().required(),
  description: Joi.string().required().min(10).max(200),
  info: Joi.string().required().min(80),
  price: Joi.number().required(),
  level: Joi.string().required(),
  certificate: Joi.boolean().required(),
  lesson: Joi.number().required(),
  amount: Joi.number().required(),
  start_date: Joi.alternatives().conditional('end_date', {
    then: Joi.date()
  }),
  end_date: Joi.date().min(Joi.ref('start_date')),
})
// update course
router.put("/updateCourse/", verifyToken, upload.single("fileupload"), async (req, res) => {
  const { error, value } = updateCourseSchema.validate(req.body, { abortEarly: true})
  if(error){
    return res.status(400).json({message: error.message})
  }
  try {
    const data = req.body;
    const file = req.file;

    const course_id = data.course_id;

    data["start_date"] = new Date(data["start_date"]);
    data["end_date"] = new Date(data["end_date"]);
    data["price"] = Number(data["price"]);
    data["lesson"] = Number(data["lesson"]);
    data["certificate"] = convertToBoolean(data["certificate"]);
    data["amount"] = Number(data["amount"]);
    if (file) {
      data["course_image"] = file.filename;
    }

    const updatedCourse = await prisma.course.update({
      where: {
        course_id: course_id,
      },
      data: data,
    });
    res.status(200).json(updatedCourse);
  } catch (err) {
    console.log(err.message);

    res.status(500).json({ message: err.message });
  }
});

export default router;
