import fs from "node:fs";
import path from "node:path";

import { db } from "@earthworm/db";
import {
  coursePack,
  course as courseSchema,
  statement as statementSchema,
} from "@earthworm/schema";

type Statement = typeof statementSchema.$inferInsert;

const courses = fs.readdirSync(path.resolve(__dirname, "../data/cet6-listening"));

(async function () {
  const [coursePackEntity] = await db
    .insert(coursePack)
    .values({
      order: 4,
      title: "CET-6 听力专项突破",
      description:
        "基于2024-2025年六级真题男音素材，涵盖精听技巧与信号词、长对话场景（职场/预订）、短文听力（工作平衡/自由职业/职业发展）、讲座精听（社交媒体/决策/幸福与成功）以及听力考点总结",
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
        path.resolve(__dirname, `../data/cet6-listening/${meta.courseFileName}`),
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

  console.log("CET-6 听力专项突破 全部创建完成");
  process.exit(0);
})();

function getCourseName(num: number): string {
  const courseTitles: Record<number, string> = {
    1: "精听核心技巧与信号词",
    2: "真题精听：职场对话(2025-06)",
    3: "真题精听：预订沟通(2025-12)",
    4: "真题精听：工作与休息的平衡",
    5: "真题精听：自由职业的利与弊",
    6: "真题精听：外交服务与职业发展",
    7: "真题精听：社交媒体与心理健康",
    8: "真题精听：直觉与理性决策",
    9: "真题精听：幸福与成功的关系",
    10: "真题精听：学业选择与听力考点总结",
  };

  return courseTitles[num] || `第${num}课`;
}
