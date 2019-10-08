class NodeHog {
  constructor(type = 'cpu', lifespan = 300000, deathspan = 600000, iterations = 10) {
    this.type = type.toString() === 'memory' ? 'memory' : 'cpu';
    this.lifespan = parseInt(lifespan, 10) || 300000;
    this.deathspan = parseInt(deathspan, 10) || 600000;
    this.iterations = parseInt(iterations, 10) || 10;
    this.pid = Math.random().toString(36).substr(2, 5);

    this.acc = this.type === 'memory' ? [] : 0;
    this.periodType = this.lifespan > 60000 ? 'minute' : 'second';
    this.period = this.periodType === 'minute' ? 60000 : 1000;
    this.periodCount = 0;
    this.startTime = 0;
    this.loggerInc = 0;
    this.toggle = false;

    this.reset = () => {
      this.periodCount = 0;
      this.startTime = 0;
      this.loggerInc = 0;
      this.toggle = false;

      if (this.type === 'memory') {
        this.acc = [];
      } else if (this.type === 'cpu') {
        this.acc = 0;
      }

      this.intervals.forEach(interval => clearInterval(interval));
      this.timeouts.forEach(timeout => clearTimeout(timeout));
    };

    this.intervals = [];
    this.timeouts = [];
  }
  
  async start() {
    console.log('\n===========================================\n> Starting new NodeHog [ ' + this.pid + ' ].\n');

    for (let i = 0; i < this.iterations; i++) {
      await this.stress();
      await this.relieve();

      if (i === this.iterations - 1) {
        console.log('\n> Killing NodeHog [ ' + this.pid + ' ].\n-------------------------------------------\n');
      }
    }
  }

  stress() {
    this.startTime = Date.now(),
    this.loggerInc = this.startTime;

    console.log('\n[ ' + this.pid + ' ] --> Stressing ' + this.type.toUpperCase() + '...\n');

    return new Promise(resolve => {
      const endStressTime = this.lifespan / 1000;
      let endStressInc = 0;
      let toggle = true;
      const maybeEnd = callback => {
        if (endStressInc > endStressTime) {
          logger(true);
          this.reset();
          resolve();
        }
      };

      this.intervals.push(setInterval(() => {
        maybeEnd();
        this.logger();
        endStressInc++;
      }, 1000));

      if (this.type === 'cpu') {
        this.stressCpu();
      } else if (this.type === 'memory') {
        this.stressMemory();
      }
    });
  }

  stressCpu() {
    this.toggle = true;
    while (this.toggle) {
      this.acc += Math.random() * Math.random();
    }
  }

  stressMemory() {
    const v8 = require('v8');
    v8.setFlagsFromString('--max_old_space_size=32768');

    const stressMem = () => {
      const {heapTotal, heapUsed} = process.memoryUsage()
      const cushion = 10000;
      const available8Bits = (((heapTotal - heapUsed) / 8) - cushion).toFixed(0);

      if (available8Bits > 0) {
        const heapHog = new Float64Array(available8Bits);
        this.acc.push(heapHog);
      }
    }

    this.intervals.push(setInterval(() => {
      stressMem();
    }, 50));
  }

  relieve() {
    console.log('\n[ ' + this.pid + ' ] --> Relieving...\n');

    return new Promise(resolve => {
      this.timeouts.push(setTimeout(() => {
        this.reset();
        resolve();
      }, this.deathspan));
    });
  }

  logger(force) {
    const now = Date.now();
    const timeDiff = now - this.loggerInc;

    if (timeDiff > this.period || force) {
      this.periodCount++;
      const plural = this.periodCount > 1 ? 's' : '';

      console.log('[ ' + this.pid + ' ] ----> ' + 
        this.periodCount + 
        ' ' + 
        this.periodType + 
        plural + 
        ' of stress period complete.');

      this.loggerInc = Date.now();
    }
  };
}

module.exports = NodeHog;
module.exports.default = NodeHog;

