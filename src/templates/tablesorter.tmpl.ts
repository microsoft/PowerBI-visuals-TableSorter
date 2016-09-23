/*
 * Copyright (C) 2016 Microsoft
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

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
