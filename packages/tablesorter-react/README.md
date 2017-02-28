[![CircleCI](https://circleci.com/gh/Microsoft/PowerBI-visuals-TableSorter.svg?style=svg)](https://circleci.com/gh/Microsoft/PowerBI-visuals-TableSorter)

# TableSorter
Table Sorter lets you create stacked table columns to explore how different combinations and weightings of numerical column values result in different rank orderings of table records. Column headings show the distribution of column values and support rapid re-sorting of table rows (which may also be filtered by linked visuals). Table Sorter is built on LineUp (http://caleydo.github.io/tools/lineup/)."

> This visual is currently in beta testing and is undergoing active development.

## Getting Started
* Fork this repo
* Install [node.js 6+](https://nodejs.org)
* Run `npm install` on the project directory
* The `src` directory contains all of the visual's code.

## Building
* Running `npm run build` will do the following:
  * Compiles the `src` directory.
  * Creates a `.pbiviz` file in the `dist\powerbi` directory.
    * Go to [Power BI](https://app.powerbi.com/), and to import your new visual.
