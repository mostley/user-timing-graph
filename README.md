# Usage (simple)

- Copy the following command into the console of your project

  `console.log('https://mostley.github.io/user-timing-graph/#' + encodeURIComponent(JSON.stringify(performance.getEntries().filter(function(item){ return item.entryType !== 'resource'}).map(function(item){return { name: item.name, startTime: item.startTime, duration: item.duration, entryType: item.entryType }}))))`

- Click the link that is printed

# Usage (expert)

The page takes the JSON serialized entries as parameters via location hash, just make sure you filter the data so not to overload the URL.

# Bookmarklet

Drag this link to your bookmarks bar: [+ Show Timing](javascript:(function()%7Bwindow.open('https%3A%2F%2Fmostley.github.io%2Fuser-timing-graph%2F%23'%20%2B%20encodeURIComponent(JSON.stringify(performance.getEntries().filter(function(item)%7B%20return%20item.entryType%20!%3D%3D%20'resource'%7D).map(function(item)%7Breturn%20%7B%20name%3A%20item.name%2C%20startTime%3A%20item.startTime%2C%20duration%3A%20item.duration%2C%20entryType%3A%20item.entryType%20%7D%7D))))%7D)())

