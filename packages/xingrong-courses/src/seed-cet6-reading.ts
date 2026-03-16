import fs from "node:fs";
import path from "node:path";

import { db } from "@earthworm/db";
import {
  coursePack,
  course as courseSchema,
  statement as statementSchema,
} from "@earthworm/schema";

type Statement = typeof statementSchema.$inferInsert;

const courses = fs.readdirSync(path.resolve(__dirname, "../data/cet6-reading"));

(async function () {
  const [coursePackEntity] = await db
    .insert(coursePack)
    .values({
      order: 3,
      title: "CET-6 阅读专项突破",
      description:
        "专门练习六级阅读理解的课程，涵盖定位技巧、题型解析、高频同义替换词（动词/形容词/名词）、答案信号词、正确与错误选项特征，以及10秒排除法实战技巧",
      creatorId: "1",
      shareLevel: "public",
      isFree: true,
      cover: "",
    })
    .returning();

  console.log(`创建课程包: ${coursePackEntity.title} (id: ${coursePackEntity.id})`);

  const courseList = await Promise.all(
    courses.map(async (courseFileName, index) => {
      const [course] = await db
        .insert(courseSchema)
        .values({
          coursePackId: coursePackEntity.id,
          order: index + 1,
          title: getCourseName(index + 1),
        })
        .returning({ id: courseSchema.id, order: courseSchema.order, title: courseSchema.title });

      console.log(`创建: id-${course.id} order-${course.order} title-${course.title}`);

      return {
        ...course,
        meta: {
          courseFileName,
        },
      };
    }),
  );

  await Promise.all(
    courseList.map(async (course) => {
      const { id: courseId, meta } = course;

      const courseDataJsonText = fs.readFileSync(
        path.resolve(__dirname, `../data/cet6-reading/${meta.courseFileName}`),
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

  console.log("CET-6 阅读专项突破 全部创建完成");
  process.exit(0);
})();

function getCourseName(num: number): string {
  const courseTitles: Record<number, string> = {
    1: "阅读核心原则与定位技巧",
    2: "题型解析：细节题与主旨题",
    3: "题型解析：推理题与态度题",
    4: "答案信号词：转折、因果与观点",
    5: "高频同义替换：动词篇（上）",
    6: "高频同义替换：动词篇（下）",
    7: "高频同义替换：形容词与副词篇",
    8: "高频同义替换：名词与逻辑词篇",
    9: "正确选项特征与错误选项识别",
    10: "实战技巧：10秒排除法与口诀",
  };

  return courseTitles[num] || `第${num}课`;
}
