import fs from "node:fs";
import path from "node:path";

import { db } from "@earthworm/db";
import {
  coursePack,
  course as courseSchema,
  statement as statementSchema,
} from "@earthworm/schema";

type Statement = typeof statementSchema.$inferInsert;

const courses = fs.readdirSync(path.resolve(__dirname, "../data/courses"));

(async function () {
  await db.delete(statementSchema);
  await db.delete(courseSchema);
  await db.delete(coursePack);

  const [coursePackEntity] = await db
    .insert(coursePack)
    .values({
      order: 1,
      title: "大学英语六级(CET-6)全面备考",
      description:
        "涵盖六级大纲词汇、阅读理解句型、写作高分句型、翻译练习和听力常用表达，全面提升听、阅、写、译能力",
      creatorId: "1",
      shareLevel: "public",
      isFree: true,
      cover: "",
    })
    .returning();

  const courseList = await Promise.all(
    courses.map(async (courseFileName, index) => {
      const courseName = path.parse(courseFileName).name;
      const [course] = await db
        .insert(courseSchema)
        .values({
          coursePackId: coursePackEntity.id,
          // Index starts from 0
          order: index + 1,
          title: convertToChineseNumber(courseName),
        })
        .returning({ id: courseSchema.id, order: courseSchema.order, title: courseSchema.title });

      console.log(`创建: id-${course.id} order-${course.order} title-${course.title}`);

      return {
        ...course,
        meta: {
          courseFileName,
          courseName,
        },
      };
    }),
  );

  await Promise.all(
    courseList.map(async (course) => {
      const { id: courseId, meta } = course;

      const courseDataJsonText = fs.readFileSync(
        path.resolve(__dirname, `../data/courses/${meta.courseFileName}`),
        "utf-8",
      );

      const statementList = JSON.parse(courseDataJsonText) as Statement[];

      let order = 1;
      const statementInsertTask = statementList.map(async (statement) => {
        return await db.insert(statementSchema).values({
          ...statement,
          order: order++,
          courseId,
        });
      });

      console.log(`courseName: ${meta.courseFileName} 开始上传`);
      await Promise.all(statementInsertTask);
      console.log(`courseName: ${meta.courseFileName} 全部上传成功`);
    }),
  );

  console.log("全部创建完成");
  process.exit(0);
})();

function convertToChineseNumber(numStr: string): string {
  const num = parseInt(numStr, 10);
  const courseTitles: Record<number, string> = {};

  // 01-10: 高频词汇
  for (let i = 1; i <= 10; i++) courseTitles[i] = `CET-6 高频词汇(${i})`;
  // 11-20: 核心词汇
  for (let i = 11; i <= 20; i++) courseTitles[i] = `CET-6 核心词汇(${i - 10})`;
  // 21-40: 进阶词汇
  for (let i = 21; i <= 40; i++) courseTitles[i] = `CET-6 进阶词汇(${i - 20})`;
  // 41-43: 阅读理解
  for (let i = 41; i <= 43; i++) courseTitles[i] = `CET-6 阅读理解高频句型(${i - 40})`;
  // 44-46: 写作
  for (let i = 44; i <= 46; i++) courseTitles[i] = `CET-6 写作高分句型(${i - 43})`;
  // 47-49: 翻译
  courseTitles[47] = "CET-6 翻译练习：中国文化";
  courseTitles[48] = "CET-6 翻译练习：经济与社会";
  courseTitles[49] = "CET-6 翻译练习：教育与科技";
  // 50-52: 听力
  courseTitles[50] = "CET-6 听力常用表达：校园生活";
  courseTitles[51] = "CET-6 听力常用表达：职场与新闻";
  courseTitles[52] = "CET-6 听力常用表达：观点与建议";
  // 53-55: 词汇进阶
  for (let i = 53; i <= 55; i++) courseTitles[i] = `CET-6 词汇进阶(${i - 52})`;
  // 56-58: 同义词替换
  for (let i = 56; i <= 58; i++) courseTitles[i] = `CET-6 同义词替换(${i - 55})`;

  return courseTitles[num] || `第${num}课`;
}
