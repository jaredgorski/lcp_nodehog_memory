const NodeHog = require('nodehog');
new NodeHog('memory', 1200000, 300000, 3).start();
