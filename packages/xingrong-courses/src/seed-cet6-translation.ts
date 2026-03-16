import fs from "node:fs";
import path from "node:path";

import { db } from "@earthworm/db";
import {
  coursePack,
  course as courseSchema,
  statement as statementSchema,
} from "@earthworm/schema";

type Statement = typeof statementSchema.$inferInsert;

const courses = fs.readdirSync(path.resolve(__dirname, "../data/cet6-translation"));

(async function () {
  const [coursePackEntity] = await db
    .insert(coursePack)
    .values({
      order: 2,
      title: "CET-6 翻译专项突破",
      description:
        "专门练习六级翻译的课程，涵盖传统文化、社会经济、科技教育三大高频主题词汇，高分万能句型，高分语法结构，以及押题翻译真题练习",
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
        path.resolve(__dirname, `../data/cet6-translation/${meta.courseFileName}`),
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

  console.log("CET-6 翻译专项突破 全部创建完成");
  process.exit(0);
})();

function getCourseName(num: number): string {
  const courseTitles: Record<number, string> = {
    1: "翻译高频词汇：传统文化",
    2: "翻译高频词汇：社会经济",
    3: "翻译高频词汇：科技教育",
    4: "高分句型：开头引入与重要性",
    5: "高分句型：变化、原因与据报道",
    6: "高分语法：非谓语动词与定语从句",
    7: "高分语法：被动语态与高级结构",
    8: "押题翻译：剪纸与书法",
    9: "押题翻译：城市化与高铁",
    10: "押题翻译：在线教育与万能模板",
  };

  return courseTitles[num] || `第${num}课`;
}
