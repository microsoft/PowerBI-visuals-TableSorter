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
                        "layout": "{\"columns\":[{\"label\":\"Customer Name\",\"column\":\"Customer Name\",\"type\":\"string\"}],\"primaryKey\":\"id\",\"layout\":{\"primary\":[{\"width\":50,\"type\":\"rank\"},{\"width\":200,\"column\":\"Customer Name\"}]}}"
                    }
                },
                "columns": [
                    {
                        "roles": {
                            "Values": true
                        },
                        "type": {
                            "underlyingType": 1,
                            "category": <any>null
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
                            "underlyingType": 519,
                            "category": <any>null,
                            "temporalType": {
                                "underlyingType": 519
                            }
                        },
                        "displayName": "Order Date",
                        "queryName": "Orders.Order Date",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "Orders",
                                "variable": "o"
                            },
                            "ref": "Order Date"
                        }
                    }
                ]
            },
            "table": {
                "rows": [
                    [
                        "Aaron Bergman",
                        "2009-07-01T07:00:00.000Z"
                    ],
                    [
                        "Aaron Bergman",
                        "2009-07-07T07:00:00.000Z"
                    ],
                    [
                        "Aaron Bergman",
                        "2010-07-27T07:00:00.000Z"
                    ],
                    [
                        "Aaron Bergman",
                        "2010-11-09T08:00:00.000Z"
                    ],
                    [
                        "Aaron Bergman",
                        "2011-05-28T07:00:00.000Z"
                    ],
                    [
                        "Aaron Hawkins",
                        "2009-08-15T07:00:00.000Z"
                    ],
                    [
                        "Aaron Hawkins",
                        "2009-12-13T08:00:00.000Z"
                    ],
                    [
                        "Aaron Hawkins",
                        "2010-05-26T07:00:00.000Z"
                    ],
                    [
                        "Aaron Hawkins",
                        "2010-10-04T07:00:00.000Z"
                    ],
                    [
                        "Aaron Hawkins",
                        "2011-02-24T08:00:00.000Z"
                    ]
                ],
                "columns": [
                    {
                        "displayName": "Customer Name",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "Orders",
                                "variable": "o"
                            },
                            "ref": "Customer Name"
                        },
                        "roles": {
                            "Values": true
                        },
                        "type": {
                            "underlyingType": 1,
                            "bool": false,
                            "text": true,
                            "integer": false,
                            "numeric": false,
                            "dateTime": false
                        }
                    },
                    {
                        "displayName": "Order Date",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "Orders",
                                "variable": "o"
                            },
                            "ref": "Order Date"
                        },
                        "roles": {
                            "Rank": true
                        },
                        "type": {
                            "underlyingType": 519,
                            "bool": false,
                            "text": false,
                            "integer": false,
                            "numeric": false,
                            "dateTime": true
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
                                    "ref": "Order Date"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 519,
                                        "category": <any>null,
                                        "temporalType": {
                                            "underlyingType": 519
                                        }
                                    },
                                    "value": "2009-07-01T07:00:00.000Z",
                                    "valueEncoded": "datetime'2009-07-01T00:00:00'"
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
                                    "ref": "Order Date"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 519,
                                        "category": <any>null,
                                        "temporalType": {
                                            "underlyingType": 519
                                        }
                                    },
                                    "value": "2009-07-07T07:00:00.000Z",
                                    "valueEncoded": "datetime'2009-07-07T00:00:00'"
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
                                    "ref": "Order Date"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 519,
                                        "category": <any>null,
                                        "temporalType": {
                                            "underlyingType": 519
                                        }
                                    },
                                    "value": "2010-07-27T07:00:00.000Z",
                                    "valueEncoded": "datetime'2010-07-27T00:00:00'"
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
                                    "ref": "Order Date"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 519,
                                        "category": <any>null,
                                        "temporalType": {
                                            "underlyingType": 519
                                        }
                                    },
                                    "value": "2010-11-09T08:00:00.000Z",
                                    "valueEncoded": "datetime'2010-11-09T00:00:00'"
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
                                    "ref": "Order Date"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 519,
                                        "category": <any>null,
                                        "temporalType": {
                                            "underlyingType": 519
                                        }
                                    },
                                    "value": "2011-05-28T07:00:00.000Z",
                                    "valueEncoded": "datetime'2011-05-28T00:00:00'"
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
                                    "ref": "Order Date"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 519,
                                        "category": <any>null,
                                        "temporalType": {
                                            "underlyingType": 519
                                        }
                                    },
                                    "value": "2009-08-15T07:00:00.000Z",
                                    "valueEncoded": "datetime'2009-08-15T00:00:00'"
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
                                    "ref": "Order Date"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 519,
                                        "category": <any>null,
                                        "temporalType": {
                                            "underlyingType": 519
                                        }
                                    },
                                    "value": "2009-12-13T08:00:00.000Z",
                                    "valueEncoded": "datetime'2009-12-13T00:00:00'"
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
                                    "ref": "Order Date"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 519,
                                        "category": <any>null,
                                        "temporalType": {
                                            "underlyingType": 519
                                        }
                                    },
                                    "value": "2010-05-26T07:00:00.000Z",
                                    "valueEncoded": "datetime'2010-05-26T00:00:00'"
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
                                    "ref": "Order Date"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 519,
                                        "category": <any>null,
                                        "temporalType": {
                                            "underlyingType": 519
                                        }
                                    },
                                    "value": "2010-10-04T07:00:00.000Z",
                                    "valueEncoded": "datetime'2010-10-04T00:00:00'"
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
                                    "ref": "Order Date"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 519,
                                        "category": <any>null,
                                        "temporalType": {
                                            "underlyingType": 519
                                        }
                                    },
                                    "value": "2011-02-24T08:00:00.000Z",
                                    "valueEncoded": "datetime'2011-02-24T00:00:00'"
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
                        "ref": "Order Date"
                    }
                ]
            }
        }
    ]
};

import merge = require("lodash/merge");
import cloneDeep = require("lodash/cloneDeep");

/* tslint:enable */

export default function userLoadedDatasetWithANonNumericRankColumn() {
    "use strict";
    const clonedOptions = <powerbi.VisualUpdateOptions><any>cloneDeep(data);

    // Parse the table rows into dates, cause that is what PBI would do
    clonedOptions.dataViews[0].table.rows.forEach(n => {
        const unparsedDate = n[1];
        n[1] = new Date(Date.parse(<any>unparsedDate));
    });

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
        dataViews: clonedOptions.dataViews,
    };
};
