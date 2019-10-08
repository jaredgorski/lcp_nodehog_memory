class NodeHog {
  // constructor(type = 'cpu', lifespan = 300000, deathspan = 600000, iterations = 10) {
  constructor(type = 'cpu', lifespan = 300000, deathspan = 300000, iterations = 10) {
    this.type = type.toString() === 'memory' ? 'memory' : 'cpu';
    this.lifespan = parseInt(lifespan, 10) || 300000;
    this.deathspan = parseInt(deathspan, 10) || 600000;
    this.iterations = parseInt(iterations, 10) || 10;
    this.pid = Math.random().toString(36).substr(2, 5);

    this.acc = this.type === 'memory' ? [] : 0;
    this.periodType = this.lifespan > 60000 ? 'minute' : 'second';
    this.period = this.periodType === 'minute' ? 60000 : 1000;
    this.periodCount = 0;
    this.toggle = false;

    this.reset = () => {
      this.periodCount = 0;
      this.toggle = false;
      delete this.acc;

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
    console.log('\n[ ' + this.pid + ' ] --> Stressing ' + this.type.toUpperCase() + '...\n');

    return new Promise(resolve => {
      const endStressGoal = this.lifespan / this.period;
      let endStressInc = 0;
      const maybeEnd = callback => {
        if (endStressInc >= endStressGoal) {
          this.reset();
          resolve();
        }
      };

      this.intervals.push(setInterval(() => {
        this.periodLogger();
        maybeEnd();
        endStressInc++;
      }, this.period));

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
      const cushion = 1000;
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

  periodLogger() {
    if (this.periodCount > 0) {
      const plural = this.periodCount > 1 ? 's' : '';
      console.log('[ ' + this.pid + ' ] ----> ' + 
        this.periodCount + 
        ' ' + 
        this.periodType + 
        plural + 
        ' of stress period complete.'
      );
    }

    this.periodCount++;
  }
}

module.exports = NodeHog;
module.exports.default = NodeHog;

