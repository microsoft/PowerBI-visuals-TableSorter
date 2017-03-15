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
                        "layout": "{\"columns\":[{\"label\":\"Customer Name\",\"column\":\"Customer Name\",\"type\":\"string\"},{\"label\":\"Discount\",\"column\":\"Discount\",\"type\":\"number\",\"domain\":[0,0.1]},{\"label\":\"Profit\",\"column\":\"Profit\",\"type\":\"number\",\"domain\":[-11984.3979,14440.39]}],\"primaryKey\":\"id\",\"layout\":{\"primary\":[{\"width\":50,\"type\":\"rank\"},{\"width\":200,\"column\":\"Customer Name\"},{\"width\":200,\"type\":\"stacked\",\"children\":[{\"width\":100,\"column\":\"Discount\",\"type\":\"number\",\"weight\":1},{\"width\":100,\"column\":\"Profit\",\"type\":\"number\",\"weight\":1}],\"label\":\"Stacked\",\"domain\":[0,2]},{\"width\":100,\"column\":\"Discount\",\"type\":\"number\",\"domain\":[0,0.1]},{\"width\":100,\"column\":\"Profit\",\"type\":\"number\",\"domain\":[-11984.3979,14440.39]}]},\"sort\":{\"stack\":{\"name\":\"Stacked\",\"columns\":[{\"column\":\"Discount\",\"weight\":0.5},{\"column\":\"Profit\",\"weight\":0.5}]},\"asc\":false}}"
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
                            "Values": true
                        },
                        "type": {
                            "underlyingType": 259,
                            "category": <any>null
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
                    },
                    {
                        "roles": {
                            "Values": true
                        },
                        "type": {
                            "underlyingType": 259,
                            "category": <any>null
                        },
                        "format": "0.00",
                        "displayName": "Profit",
                        "queryName": "Orders.Profit",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "Orders",
                                "variable": "o"
                            },
                            "ref": "Profit"
                        }
                    }
                ]
            },
            "table": {
                "rows": [
                    [
                        "Aaron Bergman",
                        0,
                        1148.904
                    ],
                    [
                        "Aaron Bergman",
                        0.01,
                        -30.51
                    ],
                    [
                        "Aaron Bergman",
                        0.01,
                        1.32
                    ],
                    [
                        "Aaron Bergman",
                        0.01,
                        4.56
                    ],
                    [
                        "Aaron Bergman",
                        0.03,
                        -47.64
                    ],
                    [
                        "Aaron Bergman",
                        0.08,
                        1219.87
                    ],
                    [
                        "Aaron Bergman",
                        0.09,
                        729.34
                    ],
                    [
                        "Aaron Hawkins",
                        0.01,
                        45.84
                    ],
                    [
                        "Aaron Hawkins",
                        0.01,
                        1675.98
                    ],
                    [
                        "Aaron Hawkins",
                        0.02,
                        4089.27
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
                        "displayName": "Discount",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "Orders",
                                "variable": "o"
                            },
                            "ref": "Discount"
                        },
                        "roles": {
                            "Values": true
                        },
                        "type": {
                            "underlyingType": 259,
                            "bool": false,
                            "text": false,
                            "integer": false,
                            "numeric": true,
                            "dateTime": false
                        }
                    },
                    {
                        "displayName": "Profit",
                        "expr": {
                            "_kind": 2,
                            "source": {
                                "_kind": 0,
                                "entity": "Orders",
                                "variable": "o"
                            },
                            "ref": "Profit"
                        },
                        "format": "0.00",
                        "roles": {
                            "Values": true
                        },
                        "type": {
                            "underlyingType": 259,
                            "bool": false,
                            "text": false,
                            "integer": false,
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
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Profit"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 1148.904,
                                    "valueEncoded": "1148.904D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
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
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Profit"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": -30.51,
                                    "valueEncoded": "-30.51D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
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
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Profit"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 1.32,
                                    "valueEncoded": "1.32D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
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
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Profit"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 4.56,
                                    "valueEncoded": "4.56D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
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
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Profit"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": -47.64,
                                    "valueEncoded": "-47.64D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
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
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Profit"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 1219.87,
                                    "valueEncoded": "1219.87D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
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
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Profit"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 729.34,
                                    "valueEncoded": "729.34D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
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
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Profit"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 45.84,
                                    "valueEncoded": "45.84D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
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
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Profit"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 1675.98,
                                    "valueEncoded": "1675.98D"
                                }
                            }
                        },
                        "_key": {}
                    },
                    {
                        "_expr": {
                            "_kind": 8,
                            "left": {
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
                            "right": {
                                "_kind": 13,
                                "comparison": 0,
                                "left": {
                                    "_kind": 2,
                                    "source": {
                                        "_kind": 0,
                                        "entity": "Orders"
                                    },
                                    "ref": "Profit"
                                },
                                "right": {
                                    "_kind": 17,
                                    "type": {
                                        "underlyingType": 259,
                                        "category": <any>null
                                    },
                                    "value": 4089.27,
                                    "valueEncoded": "4089.27D"
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
                    },
                    {
                        "_kind": 2,
                        "source": {
                            "_kind": 0,
                            "entity": "Orders"
                        },
                        "ref": "Profit"
                    }
                ]
            }
        }
    ]
};

const merge = require("lodash/object/merge"); // tslint:disable-line
const cloneDeep = require("lodash/lang/cloneDeep"); // tslint:disable-line
/* tslint:enable */

export default function userLoadedWithASortedStackedColumn() {
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
        numericColumn: "Discount",
        expected: {
            columns: ["Customer Name", "Discount", "Stacked", "Profit", "Discount", "Profit"],
            rowsSortedByNumericColumnAsc: [
                ["Aaron Bergman", "0.090 -> (100.0)", "729.340 -> (18.8)", "0.090", "0.090 -> (100.0)", "0.090"],
                ["Aaron Bergman", "0.080 -> (88.9)", "1219.870 -> (30.6)", "0.080", "0.080 -> (88.9)", "0.080"],
                ["Aaron Bergman", "0.030 -> (33.3)", "-47.640 -> (0.0)", "0.030", "0.030 -> (33.3)", "0.030"],
                ["Aaron Hawkins", "0.020 -> (22.2)", "4089.270 -> (100.0)", "0.020", "0.020 -> (22.2)", "0.020"],
                ["Aaron Bergman", "0.010 -> (11.1)", "-30.510 -> (0.4)", "0.010", "0.010 -> (11.1)", "0.010"],
                ["Aaron Bergman", "0.010 -> (11.1)", "1.320 -> (1.2)", "0.010", "0.010 -> (11.1)", "0.010"],
                ["Aaron Bergman", "0.010 -> (11.1)", "4.560 -> (1.3)", "0.010", "0.010 -> (11.1)", "0.010"],
                ["Aaron Hawkins", "0.010 -> (11.1)", "45.840 -> (2.3)", "0.010", "0.010 -> (11.1)", "0.010"],
                ["Aaron Hawkins", "0.010 -> (11.1)", "1675.980 -> (41.7)", "0.010", "0.010 -> (11.1)", "0.010"],
                ["Aaron Bergman", "0.000 -> (0.0)", "1148.904 -> (28.9)", "0.000", "0.000 -> (0.0)", "0.000"],
            ],
            rowsSortedByNumericColumnDesc: [
                ["Aaron Bergman", "0.000 -> (0.0)", "1148.904 -> (28.9)", "0.000", "0.000 -> (0.0)", "0.000"],
                ["Aaron Bergman", "0.010 -> (11.1)", "-30.510 -> (0.4)", "0.010", "0.010 -> (11.1)", "0.010"],
                ["Aaron Bergman", "0.010 -> (11.1)", "1.320 -> (1.2)", "0.010", "0.010 -> (11.1)", "0.010"],
                ["Aaron Bergman", "0.010 -> (11.1)", "4.560 -> (1.3)", "0.010", "0.010 -> (11.1)", "0.010"],
                ["Aaron Hawkins", "0.010 -> (11.1)", "45.840 -> (2.3)", "0.010", "0.010 -> (11.1)", "0.010"],
                ["Aaron Hawkins", "0.010 -> (11.1)", "1675.980 -> (41.7)", "0.010", "0.010 -> (11.1)", "0.010"],
                ["Aaron Hawkins", "0.020 -> (22.2)", "4089.270 -> (100.0)", "0.020", "0.020 -> (22.2)", "0.020"],
                ["Aaron Bergman", "0.030 -> (33.3)", "-47.640 -> (0.0)", "0.030", "0.030 -> (33.3)", "0.030"],
                ["Aaron Bergman", "0.080 -> (88.9)", "1219.870 -> (30.6)", "0.080", "0.080 -> (88.9)", "0.080"],
                ["Aaron Bergman", "0.090 -> (100.0)", "729.340 -> (18.8)", "0.090", "0.090 -> (100.0)", "0.090"],
            ],
        },
    };
};
