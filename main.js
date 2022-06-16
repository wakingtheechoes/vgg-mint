/* Moralis init code */
const serverUrl = 'https://md1jddp276s8.usemoralis.com:2053/server'
const appId = 'j2hj7Peclt8rq4sU7BNHCrC87IdWRk60GqNqeo9B'
const contractAddy = '0xA0bfD2B2C006c918e7a796d2b1De1F293765478B'
Moralis.start({ serverUrl, appId })

var submitAmount = 0
var mintCount = 0
var mintQty = 1

function sliderChanged(values) {
  console.log(values[0])
  mintQty = parseInt(values[0])
  document.getElementById('qty-to-mint').innerText = mintQty.toString()
}

/* Check that we can read from the contract */
async function balanceCheck() {
  let options = {
    contractAddress: contractAddy,
    functionName: 'contractBalance',
    abi: [
      {
        inputs: [],
        name: 'contractBalance',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
  }

  const balance = await Moralis.executeFunction(options)
  tokenValue = Moralis.Units.FromWei(balance)
  console.log(tokenValue)
}

/* Authentication code */
async function login() {
  let user = Moralis.User.current()
  if (user) {
    await Moralis.User.logOut()
    localStorage.removeItem('walletConnected')
  }
  user = Moralis.User.current()
  if (!user) {
    try {
      user = await Moralis.authenticate({
        signingMessage: 'Authenticate',
      })

      localStorage.setItem('walletConnected', true)
      // await Moralis.enableWeb3()
      console.log(user)
      console.log(user.get('ethAddress'))
      document.getElementById('wallet-addy').innerText =
        Moralis.User.current().get('ethAddress')
      document.getElementById('btn-connect').style.display = 'none'
      document.getElementById('btn-logout').style.display = 'block'
      let publicMintOnOptions = {
        contractAddress: contractAddy,
        functionName: 'publicFlag',
        abi: [
          {
            inputs: [],
            name: 'publicFlag',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
      }

      Moralis.executeFunction(publicMintOnOptions).then((value) => {
        if (value) {
          checkAmountEligible()
        } else {
          // document.getElementById('public-sale-off').style.display = 'block'
          // document.getElementById('public-sale-on').style.display = 'none'
          console.log('sold out')
        }
      })
    } catch (error) {
      console.log(error)
    }
  }
}

async function logOut() {
  await Moralis.User.logOut()

  localStorage.removeItem('walletConnected')
  document.getElementById('btn-connect').style.display = 'block'
  document.getElementById('btn-logout').style.display = 'none'

  document.getElementById('wallet-addy').innerText = ''
  location.reload()
}

/* submit donation and redeem */

async function mintGobs() {
  let options = {
    contractAddress: contractAddy,
    functionName: 'publicSaleMint',
    msgValue: 0,
    abi: [
      {
        inputs: [
          { internalType: 'uint256', name: 'quantity', type: 'uint256' },
        ],
        name: 'publicSaleMint',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
      },
    ],
    params: {
      quantity: mintQty,
    },
  }
  tx = await Moralis.executeFunction(options)
  document.getElementById('btn-redeem-max').setAttribute('disabled', 'disabled')
  document.getElementById('minting-tx').innerHTML =
    '<strong>Woot!</strong> You just minted ' +
    mintQty.toString() +
    ' VGGs!<br/><br/>Your gob-freeing tx is ' +
    tx.hash
  document.getElementById('tweet-button').style.display = 'block'
}

async function checkAmountEligible() {
  let totalSupplyOptions = {
    contractAddress: contractAddy,
    functionName: 'totalSupply',
    abi: [
      {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
  }
  let gobs_minted = await Moralis.executeFunction(totalSupplyOptions)
  document.getElementById('gobs-minted').innerText = gobs_minted.toString()

  let options = {
    contractAddress: contractAddy,
    functionName: 'maxPerAddress',
    abi: [
      {
        inputs: [],
        name: 'maxPerAddress',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
  }
  let number_per_wallet = await Moralis.executeFunction(options)

  options = {
    contractAddress: contractAddy,
    functionName: 'balanceOf',
    abi: [
      {
        inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
      },
    ],
    params: {
      owner: Moralis.User.current().get('ethAddress'),
    },
  }
  let balance_of_user = await Moralis.executeFunction(options)
  let mints_left = Math.max(number_per_wallet - balance_of_user, 0)
  if (mints_left > 0) {
    document.getElementById('mints-remaining').innerHTML =
      'You have ' +
      (number_per_wallet - balance_of_user).toString() +
      ' goblin mints remaining. <br/><strong>DRAG THE VAUGHNGOGH TO THE AMOUNT YOU WANT TO MINT</strong>'

    options = {
      contractAddress: contractAddy,
      functionName: 'maxPerTransaction',
      abi: [
        {
          inputs: [],
          name: 'maxPerTransaction',
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
    }
    let max_per_tx = await Moralis.executeFunction(options)
    mintCount =
      max_per_tx < number_per_wallet - balance_of_user
        ? max_per_tx
        : number_per_wallet - balance_of_user
    document.getElementById('qty-to-mint').innerText = 1

    if (mintCount < number_per_wallet - balance_of_user) {
      document.getElementById('max-per-tx').innerText =
        'Max Per Transaction: ' + max_per_tx.toString()
    }

    document.getElementById('mint-btn-wrapper').removeAttribute('hidden')

    var stepSlider = document.getElementById('slider-step')

    noUiSlider.create(stepSlider, {
      start: [1],
      step: 1,
      range: {
        min: [1],
        max: [parseInt(mintCount)],
      },
      pips: {
        mode: 'steps',
        density: 20,
      },
    })

    divElem = document.createElement('div')
    divElem.innerHTML =
      "<img src='images/vaughngogh_downsized.png' class='slider-img'/>"
    document.getElementsByClassName('noUi-handle')[0].appendChild(divElem)
    stepSlider.noUiSlider.on('change', sliderChanged)
  } else {
    document.getElementById('mints-remaining').innerHTML =
      'You have zero mints remaining :('
  }
}

document.getElementById('btn-connect').onclick = login
document.getElementById('link-connect').onclick = login
document.getElementById('btn-logout').onclick = logOut
document.getElementById('btn-redeem-max').onclick = mintGobs

const wallet_previously_connected = localStorage.getItem('walletConnected')
if (wallet_previously_connected === 'true') {
  Moralis.enableWeb3().then(() => {
    if (Moralis.User.current()) {
      document.getElementById('wallet-addy').innerText =
        Moralis.User.current().get('ethAddress')
      document.getElementById('btn-connect').style.display = 'none'
      document.getElementById('btn-logout').style.display = 'block'

      let publicMintOnOptions = {
        contractAddress: contractAddy,
        functionName: 'publicFlag',
        abi: [
          {
            inputs: [],
            name: 'publicFlag',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
      }

      Moralis.executeFunction(publicMintOnOptions).then((value) => {
        if (value) {
          checkAmountEligible()
        } else {
          // document.getElementById('public-sale-off').style.display = 'block'
          // document.getElementById('public-sale-on').style.display = 'none'
          console.log('sold out')
        }
      })
    }
  })
}
// } else {
//   document.getElementById('mints-remaining').innerHTML =
//     'Wallet not connected. The VGGs require you to connect.'
// }
