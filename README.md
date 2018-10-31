# Usage (simple)

- Copy the following command into the console of your project

  `console.log('https://mostley.github.io/user-timing-graph/docs/index.html#' + encodeURIComponent(JSON.stringify(performance.getEntries().filter(function(item){ return item.entryType !== 'resource'}).map(function(item){return { name: item.name, startTime: item.startTime, duration: item.duration, entryType: item.entryType }}))))`

- Click the link that is printed

# Usage (expert)

The page takes the JSON serialized entries as parameters via location hash, just make sure you filter the data so not to overload the URL.

# Bookmarklet

To generate those Graphs with one click use the Bookmarklet.
[Install Bookmarklet](https://mostley.github.io/user-timing-graph/docs/bookmarklet.html)
