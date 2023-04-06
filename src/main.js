const ethers = require('ethers')
const fetch = require('node-fetch')
const {ERC4626_ABI}= require('./abis')

// This is a free tier key so idk why you'd steal it
const provider = new ethers.providers.JsonRpcProvider(
    "https://eth-mainnet.g.alchemy.com/v2/HJ_i2RGc4L49NXkuwuST53fMYye2LGeB"
)

// Useful constants for this exercise
const SECONDS_IN_YEAR = 60*60*24*365;
const EXACTLY_DAI_ADDRESS = "0x163538E22F4d38c1eb21B79939f3d2ee274198Ff"
const START_DATE = new Date("2023-03-25")
const END_DATE = new Date("2023-03-26")

/**
 * Given an APR, return the APY
 * @param {*} apr Annual percentage rate - should be between 0-100
 * @param {*} timesCompounded Number of times the insurance is compounded throughout the year - if daily, then 365
 * @returns Annual Percentage Yield - should be between 0-100
 */
const aprToApy = async (apr, timesCompounded) => {
    return ((1 + (apr / 100) / timesCompounded) ** timesCompounded - 1) * 100
}

/**
 * Given a timestamp, return the corresponding block number
 * @param date Javascript Date object
 * @returns block.number corresponding to the date
 */
const dateToBlock = async (date) => {
    const response = await fetch('https://coins.llama.fi/block/ethereum/' + Math.floor(date.getTime() / 1000).toString());
    const json = await response.json();
    return json["height"]
}

/**
 * Given an ERC4626 contract address, return the APR
 * @param {*} address Address of the ERC4626 Contract
 * @param {*} abi Abi of the ERC4626 contract, technically you only need decimals(), totalAssets(), and totalSupply()
 * @param {*} startBlockNum block.number for the start time for the apr calculation
 * @param {*} endBlockNum block.number for the end time for the apr calculation
 * @returns Annual percentage rate - should be between 0-100
 */
const ERC4626ToApr = async(address, abi, startBlockNum, endBlockNum) => {
    const ERC4626Contract = new ethers.Contract(address, abi, provider)
    const decimals = 10 ** await ERC4626Contract.decimals()

    const totalAssets = await ERC4626Contract.totalAssets({
        blockTag: endBlockNum,
    })
    const prevTotalAssets = await ERC4626Contract.totalAssets({
        blockTag: startBlockNum,
    })
    const totalSupply = await ERC4626Contract.totalSupply({
        blockTag: endBlockNum,
    })
    const prevTotalSupply = await ERC4626Contract.totalSupply({
        blockTag: startBlockNum,
    })
    const shareValue = (totalAssets * decimals) / totalSupply
    const prevShareValue = (prevTotalAssets * decimals) / prevTotalSupply
    const proportion = (shareValue * decimals) / prevShareValue
    const apr = (proportion / decimals - 1) * 365 * 100
    return apr
}

/**
 * Print the APY of the token
 * @param tokenAddress Address of an ERC4626 token
 * @param startDate Javascript Date Object
 * @param endDate Javascript Date Object
 */
const getAPYOfToken = async (tokenAddress, startDate, endDate) => {
    try {
        const apr = await ERC4626ToApr(tokenAddress, ERC4626_ABI, await dateToBlock(startDate), await dateToBlock(endDate))
        const secondsInInterval = (endDate.getTime() - startDate.getTime()) / 1000
        const apy = await aprToApy(apr, (SECONDS_IN_YEAR / secondsInInterval))

        console.log("APY: ", apy);
    } catch (e) {
        console.error("Error: ", e?.message)
    }
}

(async function() {
    await getAPYOfToken(EXACTLY_DAI_ADDRESS, START_DATE, END_DATE);
  })();