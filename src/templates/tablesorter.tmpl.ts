/**
 * The template for the table sorter
 */
export default function() {
    "use strict";
    return `
        <div class="lineup-component">
            <div class="nav">
                <ul>
                    <li class="clear-selection" title="Clear Selection">
                        <a>
                            <span class="fa-stack">
                                <i class="fa fa-check fa-stack-1x"></i>
                                <i class="fa fa-ban fa-stack-2x"></i>
                            </span>
                        </a>
                    </li>
                    <li class="add-column" title="Add Column">
                        <a>
                            <span class="fa-stack">
                                <i class="fa fa-columns fa-stack-2x"></i>
                                <i class="fa fa-plus-circle fa-stack-1x"></i>
                            </span>
                        </a>
                    </li>
                    <li class="add-stacked-column" title="Add Stacked Column">
                        <a>
                            <span class="fa-stack">
                                <i class="fa fa-bars fa-stack-2x"></i>
                                <i class="fa fa-plus-circle fa-stack-1x"></i>
                            </span>
                        </a>
                    </li>
                </ul>
                <hr/>       
            </div>
            <div style="position:relative">
                <div class="grid"></div>
                <div class='load-spinner'><div>
            </div>
        </div>
    `.trim().replace(/\n/g, "");
}
