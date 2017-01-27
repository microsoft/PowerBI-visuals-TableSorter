#TableSorter
This is the project for the PowerBI TableSorter.

#Getting Started
* Fork this repo
* Requires node 4
* Run `npm install` on the project directory to install dependencies
* Run `npm run build` which will do the following:
  * Runs the tests
  * Lints
  * Compiles the project
  * Creates a `.pbiviz` file in the `dist\powerbi` directory.
    * Go to [Power BI](https://app.powerbi.com/), and to import your new visual.

# General Information
* This project uses webpack to handle the dependency management.
* The `src/build.json` file provides additional information to the build system on how to package your visual

      {
          "output": {
              "PowerBI": { // The powerbi version of the component (if it exists)
                  "visualName": "<Class Name of the Visual >",
                  "projectId": "<Random GUID>",
                  "icon": "<File path to the icon>", // This is the icon that is used when imported into PowerBI
                  "screenshot": "<File path to the screenshot png file>", // Used in the PowerBI custom visual gallery, under your visuals details
                  "thumbnail": "<File path to the thumbnail png file>", // Used in the PowerBI custom visual gallery
                  "description": "<Description of this visual>", // Gets used in the PowerBI custom visual gallery, under your visuals details
                  "entry": "<The entry point file name, i.e The main class name for the visual>"
              }
          },
          "lintFiles": [<List of files to lint>]
      }