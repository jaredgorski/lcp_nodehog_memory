class NodeHog {
  constructor(type = 'cpu', lifespan = 300000, deathspan = 600000, iterations = 10) {
    this.type = type.toString() === 'memory' ? 'memory' : 'cpu';
    this.lifespan = parseInt(lifespan, 10) || 300000;
    this.deathspan = parseInt(deathspan, 10) || 600000;
    this.iterations = parseInt(iterations, 10) || 10;
    this.pid = Math.random().toString(36).substr(2, 5);
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
    const periodType = this.lifespan > 60000 ? 'minute' : 'second';
    const period = periodType === 'minute' ? 60000 : 1000;
    let start = Date.now(),
      now = start,
      loggerInc = start,
      periodCount = 0,
      acc = this.type === 'memory' ? [] : 0;

    const resource = this.type === 'memory' ? 'MEMORY' : 'CPU';
    console.log('\n[ ' + this.pid + ' ] --> Stressing ' + resource + '...\n');

    const logger = (force) => {
      const timeDiff = now - loggerInc;

      if (timeDiff > period || force) {
        periodCount++;
        const plural = periodCount > 1 ? 's' : '';

        console.log('[ ' + this.pid + ' ] ----> ' + 
          periodCount + 
          ' ' + 
          periodType + 
          plural + 
          ' of stress period complete.');

        loggerInc = Date.now();
      }
    };

    const stressFn = () => {
      if (this.type === 'cpu') {
        while (now - start < this.lifespan) {
          acc += Math.random() * Math.random();

          logger();
          now = Date.now();
        }
      } else if (this.type === 'memory') {
        const stressMem = () => {
          const {heapTotal, heapUsed} = process.memoryUsage()
          const available8Bits = (((heapTotal - heapUsed) / 8) - 100000).toFixed(0);

          if (available8Bits > 0) {
            const heapHog = new Float64Array(available8Bits);
            acc.push(heapHog);
          }
        }

        const int = setInterval(() => {
          const timeDiff = now - loggerInc;

          if (timeDiff > this.lifespan) {
            clearInterval(int);
          }

          stressMem();

          logger();
          now = Date.now();
        }, 500);
      }
    };

    return new Promise(resolve => {
      setTimeout(() => {
        logger(true);
        resolve();
      }, this.lifespan);

      stressFn();
    });
    
  }

  relieve() {
    console.log('\n[ ' + this.pid + ' ] --> Relieving...\n');

    return new Promise(resolve => {
      setTimeout(resolve, this.deathspan);
    });
  }
}

module.exports = NodeHog;
module.exports.default = NodeHog;

