/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/degen_cash.json`.
 */
export type DegenCash = {
  "address": "955SPKk3hC8cbqmophEAMigzaPDBrtHnVzWWS8JN6tr",
  "metadata": {
    "name": "degenCash",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Arcium & Anchor"
  },
  "instructions": [
    {
      "name": "depositCallback",
      "discriminator": [
        203,
        84,
        215,
        177,
        14,
        39,
        30,
        203
      ],
      "accounts": [
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "compDefAccount"
        },
        {
          "name": "instructionsSysvar",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "dcGlobalMintAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  99,
                  95,
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "dcUserTokenAccount",
          "writable": true
        },
        {
          "name": "userSigner"
        },
        {
          "name": "userAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "userSigner"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "dc_global_mint_account.deposit_mint",
                "account": "dcGlobalMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "dcDepositAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "dcGlobalMintAccount"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "dc_global_mint_account.deposit_mint",
                "account": "dcGlobalMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "depositMint"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "output",
          "type": {
            "defined": {
              "name": "computationOutputs",
              "generics": [
                {
                  "kind": "type",
                  "type": {
                    "defined": {
                      "name": "depositOutput"
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "initCreateDcTokenAccountCompDef",
      "discriminator": [
        213,
        170,
        4,
        123,
        68,
        48,
        149,
        6
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "mxeAccount",
          "writable": true
        },
        {
          "name": "compDefAccount",
          "docs": [
            "Can't check it here as it's not initialized yet."
          ],
          "writable": true
        },
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initDepositCompDef",
      "discriminator": [
        115,
        50,
        97,
        116,
        222,
        75,
        121,
        6
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "mxeAccount",
          "writable": true
        },
        {
          "name": "compDefAccount",
          "docs": [
            "Can't check it here as it's not initialized yet."
          ],
          "writable": true
        },
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initGlobalDcMintCallback",
      "discriminator": [
        173,
        225,
        117,
        199,
        127,
        28,
        186,
        80
      ],
      "accounts": [
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "compDefAccount"
        },
        {
          "name": "instructionsSysvar",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "dcGlobalMintAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  99,
                  95,
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "output",
          "type": {
            "defined": {
              "name": "computationOutputs",
              "generics": [
                {
                  "kind": "type",
                  "type": {
                    "defined": {
                      "name": "initGlobalDcMintOutput"
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "initGlobalDcMintCompDef",
      "discriminator": [
        211,
        124,
        150,
        202,
        4,
        192,
        249,
        33
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "mxeAccount",
          "writable": true
        },
        {
          "name": "compDefAccount",
          "docs": [
            "Can't check it here as it's not initialized yet."
          ],
          "writable": true
        },
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initTransferCompDef",
      "discriminator": [
        70,
        189,
        147,
        177,
        58,
        107,
        79,
        13
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "mxeAccount",
          "writable": true
        },
        {
          "name": "compDefAccount",
          "docs": [
            "Can't check it here as it's not initialized yet."
          ],
          "writable": true
        },
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initUserDcBalanceCallback",
      "discriminator": [
        247,
        196,
        143,
        230,
        32,
        211,
        130,
        76
      ],
      "accounts": [
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "compDefAccount"
        },
        {
          "name": "instructionsSysvar",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "dcUserTokenAccount",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "output",
          "type": {
            "defined": {
              "name": "computationOutputs",
              "generics": [
                {
                  "kind": "type",
                  "type": {
                    "defined": {
                      "name": "initUserDcBalanceOutput"
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "initWithdrawCompDef",
      "discriminator": [
        123,
        165,
        129,
        195,
        92,
        182,
        226,
        232
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "mxeAccount",
          "writable": true
        },
        {
          "name": "compDefAccount",
          "writable": true
        },
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "queueCreateDcTokenAccount",
      "discriminator": [
        183,
        130,
        165,
        35,
        70,
        63,
        48,
        10
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "signPdaAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  83,
                  105,
                  103,
                  110,
                  101,
                  114,
                  65,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "mxeAccount"
        },
        {
          "name": "mempoolAccount",
          "writable": true
        },
        {
          "name": "executingPool",
          "writable": true
        },
        {
          "name": "computationAccount",
          "writable": true
        },
        {
          "name": "compDefAccount"
        },
        {
          "name": "clusterAccount",
          "writable": true
        },
        {
          "name": "poolAccount",
          "writable": true,
          "address": "7MGSS4iKNM4sVib7bDZDJhVqB6EcchPwVnTKenCY1jt3"
        },
        {
          "name": "clockAccount",
          "address": "FHriyvoZotYiFnbUzKFjzRSb2NiaC8RPWY7jtKuKhg65"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "dcUserTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  99,
                  95,
                  117,
                  115,
                  101,
                  114,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "computationOffset",
          "type": "u64"
        },
        {
          "name": "ownerX25519",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "nonce",
          "type": "u128"
        }
      ]
    },
    {
      "name": "queueDeposit",
      "discriminator": [
        2,
        138,
        166,
        37,
        238,
        32,
        81,
        142
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "signPdaAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  83,
                  105,
                  103,
                  110,
                  101,
                  114,
                  65,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "mxeAccount"
        },
        {
          "name": "mempoolAccount",
          "writable": true
        },
        {
          "name": "executingPool",
          "writable": true
        },
        {
          "name": "computationAccount",
          "writable": true
        },
        {
          "name": "compDefAccount"
        },
        {
          "name": "clusterAccount",
          "writable": true
        },
        {
          "name": "poolAccount",
          "writable": true,
          "address": "7MGSS4iKNM4sVib7bDZDJhVqB6EcchPwVnTKenCY1jt3"
        },
        {
          "name": "clockAccount",
          "address": "FHriyvoZotYiFnbUzKFjzRSb2NiaC8RPWY7jtKuKhg65"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "dcGlobalMintAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  99,
                  95,
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "dcUserTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  99,
                  95,
                  117,
                  115,
                  101,
                  114,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "depositAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "dcGlobalMintAccount"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "depositMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "fromAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "payer"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "depositMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "depositMint"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "computationOffset",
          "type": "u64"
        },
        {
          "name": "depositAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "queueInitGlobalDcMint",
      "discriminator": [
        62,
        185,
        155,
        201,
        163,
        135,
        164,
        156
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "signPdaAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  83,
                  105,
                  103,
                  110,
                  101,
                  114,
                  65,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "mxeAccount"
        },
        {
          "name": "mempoolAccount",
          "writable": true
        },
        {
          "name": "executingPool",
          "writable": true
        },
        {
          "name": "computationAccount",
          "writable": true
        },
        {
          "name": "compDefAccount"
        },
        {
          "name": "clusterAccount",
          "writable": true
        },
        {
          "name": "poolAccount",
          "writable": true,
          "address": "7MGSS4iKNM4sVib7bDZDJhVqB6EcchPwVnTKenCY1jt3"
        },
        {
          "name": "clockAccount",
          "address": "FHriyvoZotYiFnbUzKFjzRSb2NiaC8RPWY7jtKuKhg65"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "dcGlobalMintAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  99,
                  95,
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "depositAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "dcGlobalMintAccount"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "depositMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "depositMint"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "computationOffset",
          "type": "u64"
        },
        {
          "name": "nonce",
          "type": "u128"
        },
        {
          "name": "depositMint",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "queueTransfer",
      "discriminator": [
        199,
        153,
        111,
        84,
        116,
        143,
        214,
        76
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "signPdaAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  83,
                  105,
                  103,
                  110,
                  101,
                  114,
                  65,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "mxeAccount"
        },
        {
          "name": "mempoolAccount",
          "writable": true
        },
        {
          "name": "executingPool",
          "writable": true
        },
        {
          "name": "computationAccount",
          "writable": true
        },
        {
          "name": "compDefAccount"
        },
        {
          "name": "clusterAccount",
          "writable": true
        },
        {
          "name": "poolAccount",
          "writable": true,
          "address": "7MGSS4iKNM4sVib7bDZDJhVqB6EcchPwVnTKenCY1jt3"
        },
        {
          "name": "clockAccount",
          "address": "FHriyvoZotYiFnbUzKFjzRSb2NiaC8RPWY7jtKuKhg65"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "dcGlobalMintAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  99,
                  95,
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "depositMint"
        },
        {
          "name": "dcUserTokenAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  99,
                  95,
                  117,
                  115,
                  101,
                  114,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "receiverDcUserTokenAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  99,
                  95,
                  117,
                  115,
                  101,
                  114,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "recieverPubkey"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "computationOffset",
          "type": "u64"
        },
        {
          "name": "transferAmount",
          "type": "u64"
        },
        {
          "name": "maxVariance",
          "type": "u8"
        },
        {
          "name": "recieverPubkey",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "queueWithdraw",
      "discriminator": [
        39,
        53,
        211,
        194,
        198,
        120,
        137,
        170
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "signPdaAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  83,
                  105,
                  103,
                  110,
                  101,
                  114,
                  65,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "mxeAccount"
        },
        {
          "name": "mempoolAccount",
          "writable": true
        },
        {
          "name": "executingPool",
          "writable": true
        },
        {
          "name": "computationAccount",
          "writable": true
        },
        {
          "name": "compDefAccount"
        },
        {
          "name": "clusterAccount",
          "writable": true
        },
        {
          "name": "poolAccount",
          "writable": true,
          "address": "7MGSS4iKNM4sVib7bDZDJhVqB6EcchPwVnTKenCY1jt3"
        },
        {
          "name": "clockAccount",
          "address": "FHriyvoZotYiFnbUzKFjzRSb2NiaC8RPWY7jtKuKhg65"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "dcGlobalMintAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  99,
                  95,
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "dcUserTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  99,
                  95,
                  117,
                  115,
                  101,
                  114,
                  95,
                  116,
                  111,
                  107,
                  101,
                  110,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "withdrawAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "dcGlobalMintAccount"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "withdrawMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "toAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "payer"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "withdrawMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "withdrawMint"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "computationOffset",
          "type": "u64"
        },
        {
          "name": "withdrawAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "transferCallback",
      "discriminator": [
        35,
        168,
        41,
        159,
        124,
        77,
        12,
        157
      ],
      "accounts": [
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "compDefAccount"
        },
        {
          "name": "instructionsSysvar",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "dcGlobalMintAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  99,
                  95,
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "dcUserTokenAccount",
          "writable": true
        },
        {
          "name": "receiverDcUserTokenAccount",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "output",
          "type": {
            "defined": {
              "name": "computationOutputs",
              "generics": [
                {
                  "kind": "type",
                  "type": {
                    "defined": {
                      "name": "transferOutput"
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "withdrawCallback",
      "discriminator": [
        75,
        124,
        115,
        155,
        173,
        179,
        40,
        16
      ],
      "accounts": [
        {
          "name": "arciumProgram",
          "address": "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
        },
        {
          "name": "compDefAccount"
        },
        {
          "name": "instructionsSysvar",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "dcGlobalMintAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  99,
                  95,
                  103,
                  108,
                  111,
                  98,
                  97,
                  108,
                  95,
                  109,
                  105,
                  110,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "dcUserTokenAccount",
          "writable": true
        },
        {
          "name": "userSigner"
        },
        {
          "name": "userAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "userSigner"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "dc_global_mint_account.deposit_mint",
                "account": "dcGlobalMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "dcWithdrawAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "dcGlobalMintAccount"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "dc_global_mint_account.deposit_mint",
                "account": "dcGlobalMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "depositMint"
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "output",
          "type": {
            "defined": {
              "name": "computationOutputs",
              "generics": [
                {
                  "kind": "type",
                  "type": {
                    "defined": {
                      "name": "withdrawOutput"
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "clockAccount",
      "discriminator": [
        152,
        171,
        158,
        195,
        75,
        61,
        51,
        8
      ]
    },
    {
      "name": "cluster",
      "discriminator": [
        236,
        225,
        118,
        228,
        173,
        106,
        18,
        60
      ]
    },
    {
      "name": "computationDefinitionAccount",
      "discriminator": [
        245,
        176,
        217,
        221,
        253,
        104,
        172,
        200
      ]
    },
    {
      "name": "dcGlobalMint",
      "discriminator": [
        100,
        58,
        97,
        193,
        189,
        255,
        91,
        197
      ]
    },
    {
      "name": "dcUserTokenAccount",
      "discriminator": [
        170,
        225,
        4,
        8,
        187,
        168,
        211,
        81
      ]
    },
    {
      "name": "feePool",
      "discriminator": [
        172,
        38,
        77,
        146,
        148,
        5,
        51,
        242
      ]
    },
    {
      "name": "mxeAccount",
      "discriminator": [
        103,
        26,
        85,
        250,
        179,
        159,
        17,
        117
      ]
    },
    {
      "name": "signerAccount",
      "discriminator": [
        127,
        212,
        7,
        180,
        17,
        50,
        249,
        193
      ]
    }
  ],
  "events": [
    {
      "name": "depositEvent",
      "discriminator": [
        120,
        248,
        61,
        83,
        31,
        142,
        107,
        144
      ]
    },
    {
      "name": "initGlobalDcMintEvent",
      "discriminator": [
        207,
        108,
        60,
        36,
        253,
        118,
        161,
        158
      ]
    },
    {
      "name": "transferEvent",
      "discriminator": [
        100,
        10,
        46,
        113,
        8,
        28,
        179,
        125
      ]
    },
    {
      "name": "withdrawEvent",
      "discriminator": [
        22,
        9,
        133,
        26,
        160,
        44,
        71,
        192
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "abortedComputation",
      "msg": "The computation was aborted"
    },
    {
      "code": 6001,
      "name": "clusterNotSet",
      "msg": "Cluster not set"
    },
    {
      "code": 6002,
      "name": "depositInvalid",
      "msg": "Deposit Invalid"
    },
    {
      "code": 6003,
      "name": "maxTransferAmountExceeded",
      "msg": "Max Transfer Amount Exceeded"
    },
    {
      "code": 6004,
      "name": "transferInsufficientFunds",
      "msg": "Transfer Failed: Insufficient Funds"
    },
    {
      "code": 6005,
      "name": "transferMathOverflow",
      "msg": "Transfer Failed: Math Overflow"
    },
    {
      "code": 6006,
      "name": "transferRngFailure",
      "msg": "Transfer Failed: RNG Failure"
    }
  ],
  "types": [
    {
      "name": "activation",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "activationEpoch",
            "type": {
              "defined": {
                "name": "epoch"
              }
            }
          },
          {
            "name": "deactivationEpoch",
            "type": {
              "defined": {
                "name": "epoch"
              }
            }
          }
        ]
      }
    },
    {
      "name": "circuitSource",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "local",
            "fields": [
              {
                "defined": {
                  "name": "localCircuitSource"
                }
              }
            ]
          },
          {
            "name": "onChain",
            "fields": [
              {
                "defined": {
                  "name": "onChainCircuitSource"
                }
              }
            ]
          },
          {
            "name": "offChain",
            "fields": [
              {
                "defined": {
                  "name": "offChainCircuitSource"
                }
              }
            ]
          }
        ]
      }
    },
    {
      "name": "clockAccount",
      "docs": [
        "An account storing the current network epoch"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "startEpoch",
            "type": {
              "defined": {
                "name": "epoch"
              }
            }
          },
          {
            "name": "currentEpoch",
            "type": {
              "defined": {
                "name": "epoch"
              }
            }
          },
          {
            "name": "startEpochTimestamp",
            "type": {
              "defined": {
                "name": "timestamp"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "cluster",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "maxSize",
            "type": "u32"
          },
          {
            "name": "activation",
            "type": {
              "defined": {
                "name": "activation"
              }
            }
          },
          {
            "name": "maxCapacity",
            "type": "u64"
          },
          {
            "name": "cuPrice",
            "type": "u64"
          },
          {
            "name": "cuPriceProposals",
            "type": {
              "array": [
                "u64",
                32
              ]
            }
          },
          {
            "name": "lastUpdatedEpoch",
            "type": {
              "defined": {
                "name": "epoch"
              }
            }
          },
          {
            "name": "mxes",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "nodes",
            "type": {
              "vec": {
                "defined": {
                  "name": "nodeRef"
                }
              }
            }
          },
          {
            "name": "pendingNodes",
            "type": {
              "vec": {
                "defined": {
                  "name": "nodeRef"
                }
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "computationDefinitionAccount",
      "docs": [
        "An account representing a [ComputationDefinition] in a MXE."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "finalizationAuthority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "finalizeDuringCallback",
            "type": "bool"
          },
          {
            "name": "cuAmount",
            "type": "u64"
          },
          {
            "name": "definition",
            "type": {
              "defined": {
                "name": "computationDefinitionMeta"
              }
            }
          },
          {
            "name": "circuitSource",
            "type": {
              "defined": {
                "name": "circuitSource"
              }
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "computationDefinitionMeta",
      "docs": [
        "A computation definition for execution in a MXE."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "circuitLen",
            "type": "u32"
          },
          {
            "name": "signature",
            "type": {
              "defined": {
                "name": "computationSignature"
              }
            }
          }
        ]
      }
    },
    {
      "name": "computationOutputs",
      "generics": [
        {
          "kind": "type",
          "name": "o"
        }
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "success",
            "fields": [
              {
                "generic": "o"
              }
            ]
          },
          {
            "name": "failure"
          }
        ]
      }
    },
    {
      "name": "computationSignature",
      "docs": [
        "The signature of a computation defined in a [ComputationDefinition]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "parameters",
            "type": {
              "vec": {
                "defined": {
                  "name": "parameter"
                }
              }
            }
          },
          {
            "name": "outputs",
            "type": {
              "vec": {
                "defined": {
                  "name": "output"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "dcGlobalMint",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "depositMint",
            "type": "pubkey"
          },
          {
            "name": "supply",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "supplyNonce",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "dcUserTokenAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "ownerX25519",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "amount",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "amountNonce",
            "type": "u128"
          }
        ]
      }
    },
    {
      "name": "depositEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "statusCode",
            "type": "u8"
          },
          {
            "name": "depositAmount",
            "type": "u64"
          },
          {
            "name": "newGlobalMintAmount",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "newUserDcBalance",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "depositOutput",
      "docs": [
        "The output of the callback instruction. Provided as a struct with ordered fields",
        "as anchor does not support tuples and tuple structs yet."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "field0",
            "type": {
              "defined": {
                "name": "depositOutputStruct0"
              }
            }
          }
        ]
      }
    },
    {
      "name": "depositOutputStruct0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "field0",
            "type": "u8"
          },
          {
            "name": "field1",
            "type": "u64"
          },
          {
            "name": "field2",
            "type": {
              "defined": {
                "name": "mxeEncryptedStruct",
                "generics": [
                  {
                    "kind": "const",
                    "value": "1"
                  }
                ]
              }
            }
          },
          {
            "name": "field3",
            "type": {
              "defined": {
                "name": "sharedEncryptedStruct",
                "generics": [
                  {
                    "kind": "const",
                    "value": "1"
                  }
                ]
              }
            }
          }
        ]
      }
    },
    {
      "name": "epoch",
      "docs": [
        "The network epoch"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          "u64"
        ]
      }
    },
    {
      "name": "feePool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "initGlobalDcMintEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "encryptedData",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "initGlobalDcMintOutput",
      "docs": [
        "The output of the callback instruction. Provided as a struct with ordered fields",
        "as anchor does not support tuples and tuple structs yet."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "field0",
            "type": {
              "defined": {
                "name": "mxeEncryptedStruct",
                "generics": [
                  {
                    "kind": "const",
                    "value": "1"
                  }
                ]
              }
            }
          }
        ]
      }
    },
    {
      "name": "initUserDcBalanceOutput",
      "docs": [
        "The output of the callback instruction. Provided as a struct with ordered fields",
        "as anchor does not support tuples and tuple structs yet."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "field0",
            "type": {
              "defined": {
                "name": "sharedEncryptedStruct",
                "generics": [
                  {
                    "kind": "const",
                    "value": "1"
                  }
                ]
              }
            }
          }
        ]
      }
    },
    {
      "name": "localCircuitSource",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "mxeKeygen"
          }
        ]
      }
    },
    {
      "name": "mxeAccount",
      "docs": [
        "A MPC Execution Environment."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "cluster",
            "type": {
              "option": "u32"
            }
          },
          {
            "name": "x25519Pubkey",
            "type": {
              "defined": {
                "name": "x25519Pubkey"
              }
            }
          },
          {
            "name": "fallbackClusters",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "rejectedClusters",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "computationDefinitions",
            "type": {
              "vec": "u32"
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "mxeEncryptedStruct",
      "generics": [
        {
          "kind": "const",
          "name": "len",
          "type": "usize"
        }
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nonce",
            "type": "u128"
          },
          {
            "name": "ciphertexts",
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    32
                  ]
                },
                {
                  "generic": "len"
                }
              ]
            }
          }
        ]
      }
    },
    {
      "name": "nodeRef",
      "docs": [
        "A reference to a node in the cluster.",
        "The offset is to derive the Node Account.",
        "The current_total_rewards is the total rewards the node has received so far in the current",
        "epoch."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "offset",
            "type": "u32"
          },
          {
            "name": "currentTotalRewards",
            "type": "u64"
          },
          {
            "name": "vote",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "offChainCircuitSource",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "source",
            "type": "string"
          },
          {
            "name": "hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "onChainCircuitSource",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isCompleted",
            "type": "bool"
          },
          {
            "name": "uploadAuth",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "output",
      "docs": [
        "An output of a computation.",
        "We currently don't support encrypted outputs yet since encrypted values are passed via",
        "data objects."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "plaintextBool"
          },
          {
            "name": "plaintextU8"
          },
          {
            "name": "plaintextU16"
          },
          {
            "name": "plaintextU32"
          },
          {
            "name": "plaintextU64"
          },
          {
            "name": "plaintextU128"
          },
          {
            "name": "ciphertext"
          },
          {
            "name": "arcisPubkey"
          },
          {
            "name": "plaintextFloat"
          }
        ]
      }
    },
    {
      "name": "parameter",
      "docs": [
        "A parameter of a computation.",
        "We differentiate between plaintext and encrypted parameters and data objects.",
        "Plaintext parameters are directly provided as their value.",
        "Encrypted parameters are provided as an offchain reference to the data.",
        "Data objects are provided as a reference to the data object account."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "plaintextBool"
          },
          {
            "name": "plaintextU8"
          },
          {
            "name": "plaintextU16"
          },
          {
            "name": "plaintextU32"
          },
          {
            "name": "plaintextU64"
          },
          {
            "name": "plaintextU128"
          },
          {
            "name": "ciphertext"
          },
          {
            "name": "arcisPubkey"
          },
          {
            "name": "arcisSignature"
          },
          {
            "name": "plaintextFloat"
          },
          {
            "name": "manticoreAlgo"
          },
          {
            "name": "inputDataset"
          }
        ]
      }
    },
    {
      "name": "sharedEncryptedStruct",
      "generics": [
        {
          "kind": "const",
          "name": "len",
          "type": "usize"
        }
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "encryptionKey",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "nonce",
            "type": "u128"
          },
          {
            "name": "ciphertexts",
            "type": {
              "array": [
                {
                  "array": [
                    "u8",
                    32
                  ]
                },
                {
                  "generic": "len"
                }
              ]
            }
          }
        ]
      }
    },
    {
      "name": "signerAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "timestamp",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "timestamp",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "transferEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "statusCode",
            "type": "u8"
          },
          {
            "name": "variance",
            "type": "u8"
          },
          {
            "name": "transferAmount",
            "type": "u64"
          },
          {
            "name": "newSenderBalance",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "newGlobalMintBalance",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "newReceiverBalance",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "transferOutput",
      "docs": [
        "The output of the callback instruction. Provided as a struct with ordered fields",
        "as anchor does not support tuples and tuple structs yet."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "field0",
            "type": {
              "defined": {
                "name": "transferOutputStruct0"
              }
            }
          }
        ]
      }
    },
    {
      "name": "transferOutputStruct0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "field0",
            "type": "u8"
          },
          {
            "name": "field1",
            "type": "u8"
          },
          {
            "name": "field2",
            "type": "u64"
          },
          {
            "name": "field3",
            "type": {
              "defined": {
                "name": "sharedEncryptedStruct",
                "generics": [
                  {
                    "kind": "const",
                    "value": "1"
                  }
                ]
              }
            }
          },
          {
            "name": "field4",
            "type": {
              "defined": {
                "name": "mxeEncryptedStruct",
                "generics": [
                  {
                    "kind": "const",
                    "value": "1"
                  }
                ]
              }
            }
          },
          {
            "name": "field5",
            "type": {
              "defined": {
                "name": "sharedEncryptedStruct",
                "generics": [
                  {
                    "kind": "const",
                    "value": "1"
                  }
                ]
              }
            }
          }
        ]
      }
    },
    {
      "name": "withdrawEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "statusCode",
            "type": "u8"
          },
          {
            "name": "withdrawAmount",
            "type": "u64"
          },
          {
            "name": "newGlobalMintAmount",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "newUserDcBalance",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "withdrawOutput",
      "docs": [
        "The output of the callback instruction. Provided as a struct with ordered fields",
        "as anchor does not support tuples and tuple structs yet."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "field0",
            "type": {
              "defined": {
                "name": "withdrawOutputStruct0"
              }
            }
          }
        ]
      }
    },
    {
      "name": "withdrawOutputStruct0",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "field0",
            "type": "u8"
          },
          {
            "name": "field1",
            "type": "u64"
          },
          {
            "name": "field2",
            "type": {
              "defined": {
                "name": "mxeEncryptedStruct",
                "generics": [
                  {
                    "kind": "const",
                    "value": "1"
                  }
                ]
              }
            }
          },
          {
            "name": "field3",
            "type": {
              "defined": {
                "name": "sharedEncryptedStruct",
                "generics": [
                  {
                    "kind": "const",
                    "value": "1"
                  }
                ]
              }
            }
          }
        ]
      }
    },
    {
      "name": "x25519Pubkey",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "set",
            "fields": [
              {
                "array": [
                  "u8",
                  32
                ]
              }
            ]
          },
          {
            "name": "unset",
            "fields": [
              {
                "array": [
                  "u8",
                  32
                ]
              },
              {
                "vec": "bool"
              }
            ]
          }
        ]
      }
    }
  ]
};
