# Quickstart

`yarn`

`node src/mainjs`

## Notes
The ERC-4626 Vault in question you will be looking at is Exactly Finance’s DAI Lending Vault on Ethereum, vault id 130, found at: [https://etherscan.io/address/0x163538e22f4d38c1eb21b79939f3d2ee274198ff](https://etherscan.io/address/0x163538e22f4d38c1eb21b79939f3d2ee274198ff)

## Question 1
**Question:** Use the ERC-4626 documentation found [here](https://ethereum.org/en/developers/docs/standards/tokens/erc-4626/) and the EIP documentation [here](https://eips.ethereum.org/EIPS/eip-4626) if needed, generate a formula for calculating APY on top of the given `view` functions.

How do you calculate APYs from just the view functions of EIP-4626?

Intuitively, we can check the values of convertToShares() or convertToAssets() over time to see how much 1 vault token can be redeemed for. As this number increases or decreases, the APY also increases or decreases.

Another safer way to do this is similar to the Defillama yield adapter for exactly. Since exactly is also an ERC4626, we can use similar operations.

This is the code from defillama:
```
const shareValue = (totalAssets[i] * 1e18) / totalSupply[i];
const prevShareValue = (prevTotalAssets[i] * 1e18) / prevTotalSupply[i];
const proportion = (shareValue * 1e18) / prevShareValue;
const apr = (proportion / 1e18 - 1) * 365 * 100;
```

Essentially, we take the current shareValue, which is just a call to the totalAssets() function in the ERC4626 contract divided by totalSupply(). We have to multiply by 1e18 since the exactly vault has 1e18 decimals and one share actually represents 1e18 shares.

We then find the prevShareValue, which is the value of the current shareValue 24 hours ago.

The APR is then calculated via shareValue / prevShareValue * number of days in a year(since they are using 24 hour chunks for the time different between shareValue and prevShareValue) * 100 (to turn the percentage from a number between 0 and 1 to a number between 0-100).

However, this above function only returns APRs and we want juicy APYs to bait retail, so we need to apply the following formula to turn the APR into APY.
```
APY = ((1 + APR / numberOfTimesCompounded ) ** numberOfTimesCompounded - 1) * 100
```
Finally, we can put all of that together and end up with the following formula.
```
APY = ((1 + ((totalAssets / totalSupply) / (prevTotalAssets / prevTotalSupply)) / 365) ** 365 - 1) * 100
```
## Question 2
**Question:** Use the formula calculated above to calculate APY on any desired lookback period for the vault with your on-chain data gathering method of choice

See `src/main.js`

## Next Steps
1. Clean up the codebase. Typescript, format everything, make a better readme.
2. Project APR into the future using additional features like Big Data and Machine Learning - just kidding. However, we could use emissions schedule + token price as well as historical data from defillama.