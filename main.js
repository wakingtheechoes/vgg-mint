/* Moralis init code */
const serverUrl = 'https://yzboao19fonw.usemoralis.com:2053/server'
const appId = 'sxt9lKUXnTPFSQjb6QU74X8Ja8lrsoxhnw58h096'
Moralis.start({ serverUrl, appId })

var submitAmount = 0
var mintCount = 0

/* Check that we can read from the contract */
async function balanceCheck() {
  let options = {
    contractAddress: '0x388feb700A52F87cD88e8ee5429827B795620c66',
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

/* amount to mint */
async function mintAmount() {
  let input = document.getElementById('mintQty').value
  mintCount = input
  console.log(mintCount)
  console.log('mint quantity set')
}

/* Authentication code */
async function login() {
  let user = Moralis.User.current()
  if (user) {
    await Moralis.User.logOut()
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
      checkAmountEligible()
    } catch (error) {
      console.log(error)
    }
  }
}

async function logOut() {
  await Moralis.User.logOut()

  localStorage.setItem('walletConnected', false)
  document.getElementById('btn-connect').style.display = 'block'
  document.getElementById('btn-logout').style.display = 'none'

  document.getElementById('wallet-addy').innerText = ''
  location.reload()
}

/* submit donation and redeem */

async function mintGobs() {
  let options = {
    contractAddress: '0x388feb700A52F87cD88e8ee5429827B795620c66',
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
      quantity: mintCount,
    },
  }
  await Moralis.executeFunction(options)
}

async function checkAmountEligible() {
  let options = {
    contractAddress: '0x388feb700A52F87cD88e8ee5429827B795620c66',
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
    contractAddress: '0x388feb700A52F87cD88e8ee5429827B795620c66',
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

  document.getElementById('mints-remaining').innerText =
    'You have ' +
    (number_per_wallet - balance_of_user).toString() +
    ' mints remaining'

  options = {
    contractAddress: '0x388feb700A52F87cD88e8ee5429827B795620c66',
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
  document.getElementById('qty-to-mint').innerText = mintCount.toString()

  if (mintCount < number_per_wallet - balance_of_user) {
    document.getElementById('max-per-tx').innerText =
      'Max Per Transaction: ' + max_per_tx.toString()
  }

  document.getElementById('mint-btn-wrapper').removeAttribute('hidden')
}

document.getElementById('btn-connect').onclick = login
document.getElementById('btn-logout').onclick = logOut
document.getElementById('btn-redeem-1').onclick = mintGobs

const wallet_previously_connected = localStorage.getItem('walletConnected')
if (wallet_previously_connected) {
  Moralis.enableWeb3().then(() => {
    if (Moralis.User.current()) {
      document.getElementById('wallet-addy').innerText =
        Moralis.User.current().get('ethAddress')
      document.getElementById('btn-connect').style.display = 'none'
      document.getElementById('btn-logout').style.display = 'block'

      let publicMintOnOptions = {
        contractAddress: '0x388feb700A52F87cD88e8ee5429827B795620c66',
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
          document.getElementById('public-sale-off').style.display = 'block'
          document.getElementById('public-sale-on').style.display = 'none'
        }
      })
    }
  })
}
