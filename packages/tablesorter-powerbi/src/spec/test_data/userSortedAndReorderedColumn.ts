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
                    "layout": {
                        "layout": "{\"columns\":[{\"label\":\"Customer Name\",\"column\":\"Customer Name\",\"type\":\"string\"},{\"label\":\"Product Base Margin\",\"column\":\"Product Base Margin\",\"type\":\"number\",\"domain\":[0.35,0.85]}],\"primaryKey\":\"id\",\"layout\":{\"primary\":[{\"width\":50,\"type\":\"rank\"},{\"width\":100,\"column\":\"Product Base Margin\",\"type\":\"number\",\"domain\":[0.35,0.85]},{\"width\":100,\"column\":\"Customer Name\"}]},\"sort\":{\"column\":\"Product Base Margin\",\"asc\":false}}"
                    },
                    "presentation": {
                        "labelDisplayUnits": 0,
                        "labelPrecision": 4,
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
                        "displayName": "Product Base Margin",
                        "queryName": "Orders.Product Base Margin",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "Orders",
                                "variable": "o"
                            },
                            "ref": "Product Base Margin"
                        }
                    }
                ]
            },
            "table": {
                "rows": [
                    [
                        "Aaron Bergman",
                        0.36
                    ],
                    [
                        "Aaron Bergman",
                        0.37
                    ],
                    [
                        "Aaron Bergman",
                        0.38
                    ],
                    [
                        "Aaron Bergman",
                        0.54
                    ],
                    [
                        "Aaron Bergman",
                        0.56
                    ],
                    [
                        "Aaron Bergman",
                        0.59
                    ],
                    [
                        "Aaron Hawkins",
                        0.36
                    ],
                    [
                        "Aaron Hawkins",
                        0.37
                    ],
                    [
                        "Aaron Hawkins",
                        0.38
                    ],
                    [
                        "Aaron Hawkins",
                        0.45
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
                        "displayName": "Product Base Margin",
                        "queryName": "Orders.Product Base Margin",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "Orders",
                                "variable": "o"
                            },
                            "ref": "Product Base Margin"
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
                                    "ref": "Product Base Margin"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.36,
                                    "valueEncoded": "0.36D"
                                }
                            }
                        },
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Bergman\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Product Base Margin\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.36}}}}}}"
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
                                    "ref": "Product Base Margin"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.37,
                                    "valueEncoded": "0.37D"
                                }
                            }
                        },
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Bergman\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Product Base Margin\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.37}}}}}}"
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
                                    "ref": "Product Base Margin"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.38,
                                    "valueEncoded": "0.38D"
                                }
                            }
                        },
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Bergman\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Product Base Margin\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.38}}}}}}"
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
                                    "ref": "Product Base Margin"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.54,
                                    "valueEncoded": "0.54D"
                                }
                            }
                        },
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Bergman\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Product Base Margin\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.54}}}}}}"
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
                                    "ref": "Product Base Margin"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.56,
                                    "valueEncoded": "0.56D"
                                }
                            }
                        },
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Bergman\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Product Base Margin\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.56}}}}}}"
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
                                    "ref": "Product Base Margin"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.59,
                                    "valueEncoded": "0.59D"
                                }
                            }
                        },
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Bergman\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Product Base Margin\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.59}}}}}}"
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
                                    "ref": "Product Base Margin"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.36,
                                    "valueEncoded": "0.36D"
                                }
                            }
                        },
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Hawkins\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Product Base Margin\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.36}}}}}}"
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
                                    "ref": "Product Base Margin"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.37,
                                    "valueEncoded": "0.37D"
                                }
                            }
                        },
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Hawkins\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Product Base Margin\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.37}}}}}}"
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
                                    "ref": "Product Base Margin"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.38,
                                    "valueEncoded": "0.38D"
                                }
                            }
                        },
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Hawkins\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Product Base Margin\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.38}}}}}}"
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
                                    "ref": "Product Base Margin"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 0.45,
                                    "valueEncoded": "0.45D"
                                }
                            }
                        },
                        "_key": {
                            "factoryMethod": <any>null,
                            "value": "{\"and\":{\"l\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Customer Name\"}},\"r\":{\"const\":{\"t\":1,\"v\":\"Aaron Hawkins\"}}}},\"r\":{\"comp\":{\"k\":0,\"l\":{\"col\":{\"s\":{\"e\":\"Orders\"},\"r\":\"Product Base Margin\"}},\"r\":{\"const\":{\"t\":3,\"v\":0.45}}}}}}"
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
                        "ref": "Product Base Margin"
                    }
                ]
            }
        }
    ]
};

import merge = require("lodash/object/merge") as anymerge") as any;
import cloneDeep = require("lodash/cloneDeep");

/* tslint:enable */

export default function userSortedAndFilteredRankColumn() {
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
            columns: ["Product Base Margin", "Customer Name"],
            rows: [
                ["0.590", "Aaron Bergman"],
                ["0.560", "Aaron Bergman"],
                ["0.540", "Aaron Bergman"],
                ["0.450", "Aaron Hawkins"],
                ["0.380", "Aaron Bergman"],
                ["0.380", "Aaron Hawkins"],
                ["0.370", "Aaron Bergman"],
                ["0.370", "Aaron Hawkins"],
                ["0.360", "Aaron Bergman"],
                ["0.360", "Aaron Hawkins"],
            ],
        },
    };
};
