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
                        "layout": "{\"columns\":[{\"label\":\"Customer Name\",\"column\":\"Customer Name\",\"type\":\"string\"},{\"label\":\"Discount\",\"column\":\"Discount\",\"type\":\"number\",\"domain\":[0,0.1]}],\"primaryKey\":\"id\",\"layout\":{\"primary\":[{\"width\":50,\"type\":\"rank\"},{\"width\":200,\"column\":\"Customer Name\"},{\"width\":100,\"column\":\"Discount\",\"type\":\"number\",\"domain\":[0.04833333333333334,0.1]}]}}"
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
                    }
                ]
            },
            "table": {
                "rows": [
                    [
                        "Aaron Bergman"
                    ],
                    [
                        "Aaron Hawkins"
                    ],
                    [
                        "Aaron Smayling"
                    ],
                    [
                        "Adam Bellavance"
                    ],
                    [
                        "Adam Hart"
                    ],
                    [
                        "Adam Shillingsburg"
                    ],
                    [
                        "Adrian Barton"
                    ],
                    [
                        "Adrian Hane"
                    ],
                    [
                        "Adrian Shami"
                    ],
                    [
                        "Aimee Bixby"
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
                    }
                ],
                "identity": [
                    {
                        "_expr": {
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
                        "_key": {}
                    },
                    {
                        "_expr": {
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
                        "_key": {}
                    },
                    {
                        "_expr": {
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
                                "value": "Aaron Smayling",
                                "valueEncoded": "'Aaron Smayling'"
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
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
                                "value": "Adam Bellavance",
                                "valueEncoded": "'Adam Bellavance'"
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
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
                                "value": "Adam Hart",
                                "valueEncoded": "'Adam Hart'"
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
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
                                "value": "Adam Shillingsburg",
                                "valueEncoded": "'Adam Shillingsburg'"
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
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
                                "value": "Adrian Barton",
                                "valueEncoded": "'Adrian Barton'"
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
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
                                "value": "Adrian Hane",
                                "valueEncoded": "'Adrian Hane'"
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
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
                                "value": "Adrian Shami",
                                "valueEncoded": "'Adrian Shami'"
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
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
                                "value": "Aimee Bixby",
                                "valueEncoded": "'Aimee Bixby'"
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
                    }
                ]
            }
        }
    ]
};

/* tslint:enable */

import * as _ from "lodash";
export default function userRemovesAColumnFromPBIThatWasFiltered() {
    "use strict";
    const clonedOptions = <powerbi.VisualUpdateOptions><any>_.cloneDeep(data);
    return {
        options: clonedOptions,
        expected: {
            columns: ["Customer Name"],
            rows: [
                ["Aaron Bergman"],
                ["Aaron Hawkins"],
                ["Aaron Smayling"],
                ["Adam Bellavance"],
                ["Adam Hart"],
                ["Adam Shillingsburg"],
                ["Adrian Barton"],
                ["Adrian Hane"],
                ["Adrian Shami"],
                ["Aimee Bixby"]
            ],
        },
    };
};
