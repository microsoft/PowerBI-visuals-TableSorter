/*
 * Copyright (c) Microsoft
 * All rights reserved.
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/* tslint:disable */
const data = {
    "viewport": {
        "width": 3000,
        "height": 3000
    },
    "viewMode": 1,
    "type": 2,
    "operationKind": 0,
    "dataViews": [
        {
            "metadata": {
                "objects": {
                    "layout": {
                        "layout": "{\"columns\":[{\"label\":\"Customer Name\",\"column\":\"Customer Name\",\"type\":\"string\"},{\"label\":\"Discount\",\"column\":\"Discount\",\"type\":\"string\",\"domain\":[0,0.1]},{\"label\":\" 0\",\"column\":\"GENERATED_RANK_LEVEL_0\",\"bucket\":0,\"type\":\"string\",\"width\":60,\"color\":\"#bac2ff\",\"filterable\":false,\"sortable\":false,\"isConfidence\":true},{\"label\":\"≥ 0.01\",\"column\":\"GENERATED_RANK_LEVEL_0.01\",\"bucket\":0.01,\"type\":\"string\",\"width\":60,\"color\":\"#a8b3f9\",\"filterable\":false,\"sortable\":false,\"isConfidence\":true},{\"label\":\"≥ 0.02\",\"column\":\"GENERATED_RANK_LEVEL_0.02\",\"bucket\":0.02,\"type\":\"string\",\"width\":60,\"color\":\"#95a3f2\",\"filterable\":false,\"sortable\":false,\"isConfidence\":true},{\"label\":\"≥ 0.03\",\"column\":\"GENERATED_RANK_LEVEL_0.03\",\"bucket\":0.03,\"type\":\"string\",\"width\":60,\"color\":\"#8394ec\",\"filterable\":false,\"sortable\":false,\"isConfidence\":true},{\"label\":\"≥ 0.04\",\"column\":\"GENERATED_RANK_LEVEL_0.04\",\"bucket\":0.04,\"type\":\"string\",\"width\":60,\"color\":\"#7085e5\",\"filterable\":false,\"sortable\":false,\"isConfidence\":true},{\"label\":\"≥ 0.05\",\"column\":\"GENERATED_RANK_LEVEL_0.05\",\"bucket\":0.05,\"type\":\"string\",\"width\":60,\"color\":\"#5e76df\",\"filterable\":false,\"sortable\":false,\"isConfidence\":true},{\"label\":\"≥ 0.06\",\"column\":\"GENERATED_RANK_LEVEL_0.06\",\"bucket\":0.06,\"type\":\"string\",\"width\":60,\"color\":\"#4c66d9\",\"filterable\":false,\"sortable\":false,\"isConfidence\":true},{\"label\":\"≥ 0.07\",\"column\":\"GENERATED_RANK_LEVEL_0.07\",\"bucket\":0.07,\"type\":\"string\",\"width\":60,\"color\":\"#3957d2\",\"filterable\":false,\"sortable\":false,\"isConfidence\":true},{\"label\":\"≥ 0.08\",\"column\":\"GENERATED_RANK_LEVEL_0.08\",\"bucket\":0.08,\"type\":\"string\",\"width\":60,\"color\":\"#2748cc\",\"filterable\":false,\"sortable\":false,\"isConfidence\":true},{\"label\":\"≥ 0.09\",\"column\":\"GENERATED_RANK_LEVEL_0.09\",\"bucket\":0.09,\"type\":\"string\",\"width\":60,\"color\":\"#1438c5\",\"filterable\":false,\"sortable\":false,\"isConfidence\":true},{\"label\":\"≥ 0.1\",\"column\":\"GENERATED_RANK_LEVEL_0.1\",\"bucket\":0.1,\"type\":\"string\",\"width\":60,\"color\":\"#0229bf\",\"filterable\":false,\"sortable\":false,\"isConfidence\":true}],\"primaryKey\":\"id\",\"layout\":{\"primary\":[{\"width\":50,\"type\":\"rank\"},{\"width\":200,\"column\":\"Customer Name\"},{\"width\":100,\"filter\":\"99213\",\"column\":\"Discount\"},{\"width\":60,\"column\":\"GENERATED_RANK_LEVEL_0\"},{\"width\":60,\"column\":\"GENERATED_RANK_LEVEL_0.01\"},{\"width\":60,\"column\":\"GENERATED_RANK_LEVEL_0.02\"},{\"width\":60,\"column\":\"GENERATED_RANK_LEVEL_0.03\"},{\"width\":60,\"column\":\"GENERATED_RANK_LEVEL_0.04\"},{\"width\":60,\"column\":\"GENERATED_RANK_LEVEL_0.05\"},{\"width\":60,\"column\":\"GENERATED_RANK_LEVEL_0.06\"},{\"width\":60,\"column\":\"GENERATED_RANK_LEVEL_0.07\"},{\"width\":60,\"column\":\"GENERATED_RANK_LEVEL_0.08\"},{\"width\":60,\"column\":\"GENERATED_RANK_LEVEL_0.09\"},{\"width\":60,\"column\":\"GENERATED_RANK_LEVEL_0.1\"}]},\"sort\":{\"column\":\"Discount\",\"asc\":true}}"
                    },
                    "presentation": {
                        "values": true
                    },
                },
                "columns": [
                    {
                        "roles": {
                            "Values": true
                        },
                        "type": {
                            "underlyingType": 1,
                            "category": <any>null,
                            "text": true
                        },
                        "displayName": "Customer Name",
                        "queryName": "Orders.Customer Name",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "Orders",
                                "variable": "o"
                            },
                            "ref": "Customer Name"
                        }
                    },
                    {
                        "roles": {
                            "Values": true
                        },
                        "type": {
                            "underlyingType": 259,
                            "category": <any>null,
                            "numeric": true
                        },
                        "displayName": "Discount",
                        "queryName": "Orders.Discount",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "Orders",
                                "variable": "o"
                            },
                            "ref": "Discount"
                        }
                    }
                ]
            },
            "table": {
                "rows": [
                    [
                        "Aaron Bergman",
                        0
                    ],
                    [
                        "Aaron Bergman",
                        0.01
                    ],
                    [
                        "Aaron Bergman",
                        0.03
                    ],
                    [
                        "Aaron Bergman",
                        0.08
                    ],
                    [
                        "Aaron Bergman",
                        0.09
                    ],
                    [
                        "Aaron Hawkins",
                        0.01
                    ],
                    [
                        "Aaron Hawkins",
                        0.02
                    ],
                    [
                        "Aaron Hawkins",
                        0.04
                    ],
                    [
                        "Aaron Hawkins",
                        0.05
                    ],
                    [
                        "Aaron Hawkins",
                        0.06
                    ]
                ],
                "columns": [
                    {
                        "roles": {
                            "Values": true
                        },
                        "type": {
                            "underlyingType": 1,
                            "category": <any>null,
                            "text": true
                        },
                        "displayName": "Customer Name",
                        "queryName": "Orders.Customer Name",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "Orders",
                                "variable": "o"
                            },
                            "ref": "Customer Name"
                        }
                    },
                    {
                        "roles": {
                            "Values": true
                        },
                        "type": {
                            "underlyingType": 259,
                            "category": <any>null,
                            "numeric": true
                        },
                        "displayName": "Discount",
                        "queryName": "Orders.Discount",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "Orders",
                                "variable": "o"
                            },
                            "ref": "Discount"
                        }
                    }
                ],
                "identity": [
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Customer Name"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 1,
                                        "category": <any>null
                                    },
                                    "value": "Aaron Bergman",
                                    "valueEncoded": "'Aaron Bergman'"
                                }
                            },
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Discount"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0,
                                    "valueEncoded": "0D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Customer Name"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 1,
                                        "category": <any>null
                                    },
                                    "value": "Aaron Bergman",
                                    "valueEncoded": "'Aaron Bergman'"
                                }
                            },
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Discount"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.01,
                                    "valueEncoded": "0.01D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Customer Name"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 1,
                                        "category": <any>null
                                    },
                                    "value": "Aaron Bergman",
                                    "valueEncoded": "'Aaron Bergman'"
                                }
                            },
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Discount"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.03,
                                    "valueEncoded": "0.03D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Customer Name"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 1,
                                        "category": <any>null
                                    },
                                    "value": "Aaron Bergman",
                                    "valueEncoded": "'Aaron Bergman'"
                                }
                            },
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Discount"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.08,
                                    "valueEncoded": "0.08D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Customer Name"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 1,
                                        "category": <any>null
                                    },
                                    "value": "Aaron Bergman",
                                    "valueEncoded": "'Aaron Bergman'"
                                }
                            },
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Discount"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.09,
                                    "valueEncoded": "0.09D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Customer Name"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 1,
                                        "category": <any>null
                                    },
                                    "value": "Aaron Hawkins",
                                    "valueEncoded": "'Aaron Hawkins'"
                                }
                            },
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Discount"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.01,
                                    "valueEncoded": "0.01D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Customer Name"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 1,
                                        "category": <any>null
                                    },
                                    "value": "Aaron Hawkins",
                                    "valueEncoded": "'Aaron Hawkins'"
                                }
                            },
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Discount"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.02,
                                    "valueEncoded": "0.02D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Customer Name"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 1,
                                        "category": <any>null
                                    },
                                    "value": "Aaron Hawkins",
                                    "valueEncoded": "'Aaron Hawkins'"
                                }
                            },
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Discount"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.04,
                                    "valueEncoded": "0.04D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Customer Name"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 1,
                                        "category": <any>null
                                    },
                                    "value": "Aaron Hawkins",
                                    "valueEncoded": "'Aaron Hawkins'"
                                }
                            },
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Discount"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.05,
                                    "valueEncoded": "0.05D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Customer Name"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 1,
                                        "category": <any>null
                                    },
                                    "value": "Aaron Hawkins",
                                    "valueEncoded": "'Aaron Hawkins'"
                                }
                            },
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Discount"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.06,
                                    "valueEncoded": "0.06D"
                                }
                            }
                        },
                        "_key": {}
                    }
                ],
                "identityFields": [
                    {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "Orders"
                        },
                        "ref": "Customer Name"
                    },
                    {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "Orders"
                        },
                        "ref": "Discount"
                    }
                ]
            }
        }
    ]
}

import merge = require("lodash/merge");
import cloneDeep = require("lodash/cloneDeep");

/* tslint:enable */

export default function userSwitchedRankColumnToRegularColumn() {
    "use strict";
    const clonedOptions = <powerbi.VisualUpdateOptions><any>cloneDeep(data);

    // Make sure to disable animations
    merge(clonedOptions.dataViews[0].metadata, {
        objects: {
            presentation: {
                animation: false,
            },
        },
    });

    return {
        options: clonedOptions,
        expected: {
            columns: ["Customer Name", "Discount"],
            rows: [
                ["Aaron Bergman", 0],
                ["Aaron Bergman", 0.01],
                ["Aaron Bergman", 0.03],
                ["Aaron Bergman", 0.08],
                ["Aaron Bergman", 0.09],
                ["Aaron Hawkins", 0.01],
                ["Aaron Hawkins", 0.02],
                ["Aaron Hawkins", 0.04],
                ["Aaron Hawkins", 0.05],
                ["Aaron Hawkins", 0.06],
            ],
        },
    };
};
