const path = require("path");
const LocalStorage = require("node-localstorage").LocalStorage;
const { ethers } = require("ethers");
const { EventModel: Events, counts } = require("./Events");
const localStorage = new LocalStorage(
  path.resolve(__dirname, "..", "..", "data")
);

const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("node:worker_threads");

const { methods } = require("../models/User");

const JobQueue = require("../lib/JobQueue");
const EventProcessor = require("../events/EventProcessor");
const EventSerializer = require("../events/EventSerializer");

const defaultAlertSettings = {
  delegateRelative: {
    active: true,
    percent: 1,
    message: "Voting power of $delegatee$ increased $percent$ in $time$ hours",
    timeframe: 24,
  },
  delegateAmount: {
    active: true,
    amount: 10000000,
    message: "Voting power of $delegatee$ increased $amount$ in $time$ hours",
    timeframe: 24,
  },
  transferRelative: {
    active: true,
    percent: 1.5,
    message: "$percent$% of tokens transfered to $to$ in $time$ hours",
    timeframe: 24,
  },
  transferAmount: {
    active: true,
    amount: 20000000,
    message: "$amount$ tokens transfered from $from$ to $to$",
    timeframe: 24,
  },
};

if (isMainThread) {
  const worker = new Worker(__filename, {});

  module.exports = {
    get: async () => {
      const eventCounts = await counts();
      return {
        status: localStorage.getItem("processingStatus")
          ? Number(localStorage.getItem("processingStatus"))
          : 0,
        processed: eventCounts.processed,
        fetched: eventCounts.total,
        lastProcessedBlock: localStorage.getItem("lastProcessedBlock"),
        processFrom: "",
        alertSettings: localStorage.getItem("alertSettings")
          ? localStorage.getItem("alertSettings")
          : JSON.stringify(defaultAlertSettings),
      };
    },
    start: () => {
      worker.postMessage("start");
      return "done";
    },
    pause: () => {
      worker.postMessage("pause");
      return "done";
    },
    resume: () => {
      worker.postMessage("resume");
      return "done";
    },
    reset: () => {
      worker.postMessage("reset");
      return "done";
    },
  };
} else {
  const mongooseConnector = require("../mongooseConnector");
  const Processor = () => {
    const votingPowerJobQueue = JobQueue();

    let isAddingToQueue = false;
    let isRunning = parseInt(localStorage.getItem("processingStatus")) > 0;
    let paused = [parseInt(localStorage.getItem("processingStatus")) == 2];

    const addToQueue = async () => {
      if (isAddingToQueue) return;
      isAddingToQueue = true;
      const notProcessedEvents = await EventSerializer(
        localStorage.getItem("tokenAddress"),
        localStorage.getItem("tokenCreationBlock") //15257613
      );
      notProcessedEvents.forEach((ev, i) => {
        //  console.log(ev)
        if (i % 1000 == 0) {
          // console.log(i);
        }
        votingPowerJobQueue.addJob(ev);
      });
      isAddingToQueue = false;
    };

    let runnerId;

    const setEventProcessed = (_id) => {
      return new Promise((resolve, reject) => {
        Events.updateOne(
          { _id },
          { $set: { processed: true } },
          (err, done) => {
            if (err) return reject(err);
            return resolve(done);
          }
        );
      });
    };

    if (isRunning) {
      addToQueue();
      setInterval(async () => {
        addToQueue();
      }, 1000 * 30);
      runnerId = setInterval(() => {
        if (!paused[0]) {
          votingPowerJobQueue.execute(async (currentJob) => {
            // console.log("processing: ", currentJob._id);
            try {
              await EventProcessor("", null)(currentJob);
              await setEventProcessed(currentJob._id);
            } catch (err) {
              console.log(err);
            }
          });
        }
      }, 5);
    }

    const returned =  {
      start: () => {
        localStorage.setItem("processingStatus", 1);
        addToQueue();
        runnerId = setInterval(() => {
          if (!paused[0]) {
            votingPowerJobQueue.execute(async (currentJob) => {
              //   console.log("processing: ", currentJob._id);
              try {
                await EventProcessor("", null)(currentJob);
                await setEventProcessed(currentJob._id);
              } catch (err) {
                console.log(err);
              }
            });
          }
        }, 5);
        return "done";
      },
      pause: () => {
        localStorage.setItem("processingStatus", 2);
        paused[0] = true;
        return "done";
      },
      resume: () => {
        localStorage.setItem("processingStatus", 1);
        paused[0] = false;
        return "done";
      },
      reset: async () => {
        returned.pause()
        localStorage.setItem("processingStatus", 0);
        isRunning = 0;
        paused[0] = false;
        clearInterval(runnerId);
        votingPowerJobQueue.clear();
        localStorage.setItem("lastProcessedBlock", "");
        await Events.updateMany(
          { processed: true },
          { $set: { processed: false } }
        );
        await methods.commands.reset();
        return "done";
      },
    };

    return returned
  };

  const processor = Processor();

  parentPort.on("message", (e) => {
    switch (e) {
      case "start":
        return processor.start();
      case "pause":
        return processor.pause();
      case "resume":
        return processor.resume();
      case "reset":
        return processor.reset();
    }
  });
  /*;*/
}
