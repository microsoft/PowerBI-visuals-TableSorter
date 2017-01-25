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
                        "layout": "{\"columns\":[{\"label\":\"Customer Name\",\"column\":\"Customer Name\",\"type\":\"string\"},{\"label\":\"Discount\",\"column\":\"Discount\",\"type\":\"number\",\"domain\":[0,0.1]}],\"primaryKey\":\"id\",\"layout\":{\"primary\":[{\"width\":50,\"type\":\"rank\"},{\"width\":200,\"column\":\"Customer Name\"},{\"width\":100,\"column\":\"Discount\",\"type\":\"number\",\"domain\":[0,0.1]}]}}"
                    },
                    "presentation": {
                        "values": true
                    }
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
                            "Rank": true
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
                            "Rank": true
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
};
/* tslint:enable */

import * as _ from "lodash";
export default function userSwitchedRegularColumnToRankColumn() {
    "use strict";
    const clonedOptions = <powerbi.VisualUpdateOptions><any>_.cloneDeep(data);
    const rawColumns = ["Customer Name", "Discount"];
    const rankColumns = [" 0", "≥ 0.01", "≥ 0.02", "≥ 0.03", "≥ 0.04", "≥ 0.05", "≥ 0.06", "≥ 0.08", "≥ 0.09"];
    const u: any = undefined;
    return {
        options: clonedOptions,
        expected: {
            rawColumns,
            rankColumns,
            columns: rawColumns.concat(rankColumns),
            rows: [
                ["Aaron Bergman", "100", "100", "100", "100", "100", "100", "100", "100", "100", u],
                ["Aaron Bergman", "0.01", "67", "75", "80", "83", "86", "88", "89", "90", u],
                ["Aaron Bergman", "0.03", "60", "67", "71", "75", "78", "80", "56", "50", u],
                ["Aaron Bergman", "0.08", "67", "70", "40", "50", "57", "63", "40", u, u],
                ["Aaron Bergman", "0.09", "60", "50", "33", "43", "50", "44", u, u, u],
                ["Aaron Hawkins", "0.01", "33", "20", "38", "33", "30", u, u, u, u],
                ["Aaron Hawkins", "0.02", "25", "29", "22", "20", u, u, u, u, u],
                ["Aaron Hawkins", "0.04", "17", "25", "10", u, u, u, u, u, u],
                ["Aaron Hawkins", "0.05", "14", "11", u, u, u, u, u, u, u],
                ["Aaron Hawkins", "0.06", "13", u, u, u, u, u, u, u, u],
            ],
        },
    };
};
