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
                        "layout": "{\"columns\":[{\"label\":\"Name\",\"column\":\"Name\",\"type\":\"string\"}],\"primaryKey\":\"id\",\"layout\":{\"primary\":[{\"width\":50,\"type\":\"rank\"},{\"width\":200,\"column\":\"Name\"}]}}"
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
                        "displayName": "Name",
                        "queryName": "NullValues.Name",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "NullValues",
                                "variable": "n"
                            },
                            "ref": "Name"
                        }
                    },
                    {
                        "roles": {
                            "Rank": true
                        },
                        "type": {
                            "underlyingType": 260,
                            "category": <any>null
                        },
                        "displayName": "b",
                        "queryName": "NullValues.b",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "NullValues",
                                "variable": "n"
                            },
                            "ref": "b"
                        }
                    }
                ]
            },
            "table": {
                "rows": [
                    [
                        "Apple",
                        1
                    ],
                    [
                        "Orange",
                        1
                    ],
                    [
                        "Plane",
                        null
                    ]
                ],
                "columns": [
                    {
                        "displayName": "Name",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "NullValues",
                                "variable": "n"
                            },
                            "ref": "Name"
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
                        "displayName": "b",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "NullValues",
                                "variable": "n"
                            },
                            "ref": "b"
                        },
                        "roles": {
                            "Rank": true
                        },
                        "type": {
                            "underlyingType": 260,
                            "bool": false,
                            "text": false,
                            "integer": true,
                            "numeric": true,
                            "dateTime": false
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
                                        "entity": "NullValues"
                                    },
                                    "ref": "Name"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 1,
                                        "category": <any>null
                                    },
                                    "value": "Apple",
                                    "valueEncoded": "'Apple'"
                                }
                            },
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "NullValues"
                                    },
                                    "ref": "b"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 260,
                                        "category": <any>null
                                    },
                                    "value": 1,
                                    "valueEncoded": "1L"
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
                                        "entity": "NullValues"
                                    },
                                    "ref": "Name"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 1,
                                        "category": <any>null
                                    },
                                    "value": "Orange",
                                    "valueEncoded": "'Orange'"
                                }
                            },
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "NullValues"
                                    },
                                    "ref": "b"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 260,
                                        "category": <any>null
                                    },
                                    "value": 1,
                                    "valueEncoded": "1L"
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
                                        "entity": "NullValues"
                                    },
                                    "ref": "Name"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 1,
                                        "category": <any>null
                                    },
                                    "value": "Plane",
                                    "valueEncoded": "'Plane'"
                                }
                            },
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "NullValues"
                                    },
                                    "ref": "b"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 0,
                                        "category": <any>null
                                    },
                                    "value": <any>null,
                                    "valueEncoded": "null"
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
                            "entity": "NullValues"
                        },
                        "ref": "Name"
                    },
                    {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "NullValues"
                        },
                        "ref": "b"
                    }
                ]
            }
        }
    ]
};

/* tslint:enable */

import * as _ from "lodash";
export default function userLoadedDatasetWithNullRankValues() {
    "use strict";
    const clonedOptions = <powerbi.VisualUpdateOptions><any>_.cloneDeep(data);

    // Make sure to disable animations
    _.merge(clonedOptions.dataViews[0].metadata, {
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
