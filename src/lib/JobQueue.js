const JobQueue = () => {
  const jobs = [];
  var isRunning = false;

  const addJob = (ev) => {
    if (!jobs.find((e) => String(e._id) == String(ev._id))) {
      jobs.push(ev);
    }
  };

  const execute = async (cb) => {
    const currentJob = jobs[0];
    if (currentJob && isRunning == false) {
      isRunning = true;
      await cb(currentJob);
      jobs.shift();
      return await execute(cb);
    } else {
      isRunning = false;
      return;
    }
  };

  const clear = () => {
    jobs.length = 0;
    return;
  };

  return {
    jobs,
    addJob,
    execute,
    isRunning,
    clear,
  };
};

module.exports = JobQueue;
