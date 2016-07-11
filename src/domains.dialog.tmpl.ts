/* tslint:disable */
export default function(cols: { name: string, min: number; max: number; }[], pos: {x: number, y: number }) {
    return `
        <div class="lu-popup" style="left: ${pos.x}px; top: ${pos.y}px; width: 400px;color:black"><span style="font-weight: bold">set domains</span>
            <div class="selectionTable">
                ${
                    cols.map(col => `
                        <div class='column-domain' data-column='${col.name}'>
                            <span class="datalabel" style="opacity: 0.8;"><strong>${col.name} - </strong></span>
                            <span class="min-container" style="opacity: 0.8;">Min: <input class="min-value" type="number" value="${col.min}"></span>
                            <span class="max-container" style="opacity: 0.8;">Max: <input class="max-value" type="number" value="${col.max}"></span>
                        </div>
                    `.trim().replace(/\n/g, "")).join("")
                }
            </div>
            <button class="cancel"><i class="fa fa-times"></i> cancel</button>
            <button class="ok"><i class="fa fa-check"></i> ok</button>
        </div>
    `.trim().replace(/\n/g, '');
};
