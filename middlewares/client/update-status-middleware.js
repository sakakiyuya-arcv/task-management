const Project = require('../../models/project-model');
const Task = require('../../models/task-model');

module.exports.updateStatus = async (req, res, next) => {
  try {
    await Task.updateMany(
      {
        status: { $in: ["todo", "in-progress"] }, 
        due_date: { $lt: new Date() },
        overdue: false
      },
      {
        $set: { overdue: true }
      }
    );

    await Project.updateMany(
      {
        status: "in-progress", 
        due_date: { $lt: new Date() },
        overdue: false
      },
      {
        $set: { overdue: true }
      }
    );

    // await Task.updateMany(
    //   { overdue: true, status: "done" },
    //   { $set: { overdue: false } }
    // );

    await Project.updateMany(
      { status: "completed", overdue: true },
      { $set: { overdue: false } }
    );

    await Task.updateMany(
      {
        status: { $in: ["todo", "in-progress"] }, 
        due_date: { $gt: new Date() },
        overdue: true
      },
      {
        $set: { overdue: false }
      }
    );

    await Project.updateMany(
      {
        status: "in-progress", 
        due_date: { $gt: new Date() },
        overdue: true
      },
      {
        $set: { overdue: false }
      }
    );
    
    next();

  } catch (error) {
    console.log("Lỗi cập nhật trạng thái:", error);
    next();
  }
};