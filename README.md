[![Build Status](https://travis-ci.org/Microsoft/PowerBI-visuals-TableSorter.svg?branch=develop)](https://travis-ci.org/Microsoft/PowerBI-visuals-TableSorter)

# TableSorter
Table Sorter lets you create stacked table columns to explore how different combinations and weightings of numerical column values result in different rank orderings of table records. Column headings show the distribution of column values and support rapid re-sorting of table rows (which may also be filtered by linked visuals). Table Sorter is built on LineUp (http://caleydo.github.io/tools/lineup/)."

 ![TableSorter](/assets/screenshot.png?raw=true)

> This visual is currently in beta testing and is undergoing active development.


## Usage
* Install [node.js 6+](https://nodejs.org)
* Install [yarn](https://yarnpkg.com/lang/en/docs/install)
* Run `yarn` in the project directory, which will install all the dependencies
* Run `yarn test` which will lint, test, and compile the `tablesorter` and `tablesorter-powerbi` packages.
    * Compiling `tablesorter-powerbi` will also create a `.pbiviz` file in the `packages/tablesorter-powerbi/dist` directory, which can be imported directly in [Power BI](https://app.powerbi.com/)