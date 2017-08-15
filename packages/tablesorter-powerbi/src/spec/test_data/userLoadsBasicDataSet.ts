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
    "type": 4,
    "dataViews": [
        {
            "metadata": {
                "objects": {
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
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Bergman\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Discount\"}},\"r\":{\"const\":{\"t\":3,\"v\":0}}}}}}"
                        }
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
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Bergman\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Discount\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.01}}}}}}"
                        }
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
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Bergman\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Discount\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.03}}}}}}"
                        }
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
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Bergman\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Discount\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.08}}}}}}"
                        }
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
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Bergman\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Discount\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.09}}}}}}"
                        }
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
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Hawkins\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Discount\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.01}}}}}}"
                        }
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
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Hawkins\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Discount\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.02}}}}}}"
                        }
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
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Hawkins\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Discount\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.04}}}}}}"
                        }
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
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Hawkins\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Discount\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.05}}}}}}"
                        }
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
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Hawkins\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Discount\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.06}}}}}}"
                        }
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

const merge = require("lodash/object/merge"); // tslint:disable-line
const cloneDeep = require("lodash/lang/cloneDeep"); // tslint:disable-line

/* tslint:enable */

export default function userLoadsBasicDataSet() {
    "use strict";
    const clonedOptions = <powerbi.extensibility.visual.VisualUpdateOptions><any>cloneDeep(data);

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
        numericColumn: "Discount",
        expected: {
            columns: ["Customer Name", "Discount"],
            rows: [
                ["Aaron Bergman", 0],
                ["Aaron Bergman", 0.01],
                ["Aaron Hawkins", 0.01],
                ["Aaron Hawkins", 0.02],
                ["Aaron Bergman", 0.03],
                ["Aaron Hawkins", 0.04],
                ["Aaron Hawkins", 0.05],
                ["Aaron Hawkins", 0.06],
                ["Aaron Bergman", 0.08],
                ["Aaron Bergman", 0.09],
            ],
            rowsSortedByNumericColumnAsc: [
                ["Aaron Bergman", 0],
                ["Aaron Bergman", 0.01],
                ["Aaron Hawkins", 0.01],
                ["Aaron Hawkins", 0.02],
                ["Aaron Bergman", 0.03],
                ["Aaron Hawkins", 0.04],
                ["Aaron Hawkins", 0.05],
                ["Aaron Hawkins", 0.06],
                ["Aaron Bergman", 0.08],
                ["Aaron Bergman", 0.09],
            ],
            rowsSortedByNumericColumnDesc: [
                ["Aaron Bergman", 0.09],
                ["Aaron Bergman", 0.08],
                ["Aaron Hawkins", 0.06],
                ["Aaron Hawkins", 0.05],
                ["Aaron Hawkins", 0.04],
                ["Aaron Bergman", 0.03],
                ["Aaron Hawkins", 0.02],
                ["Aaron Bergman", 0.01],
                ["Aaron Hawkins", 0.01],
                ["Aaron Bergman", 0],
            ],
        },
    };
};
