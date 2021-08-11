import Web3 from 'web3';
import * as IrcrpTokenJSON from '../../../build/contracts/IrcrpToken.json';
import { IrcrpToken } from '../../types/IrcrpToken';

const DEFAULT_SEND_OPTIONS = {
    gas: 6000000
};

export class IrcrpTokenWrapper {
    web3: Web3;

    contract: IrcrpToken;

    address: string;

    constructor(web3: Web3) {
        this.web3 = web3;
        this.contract = new web3.eth.Contract(IrcrpTokenJSON.abi as any) as any;
    }

    get isDeployed() {
        return Boolean(this.address);
    }

    async getTokenSupply(fromAddress: string) {
        
        const data = await this.contract.methods.totalSupply().call({ from: fromAddress });

        return parseInt(data, 10);
    }
	
    async balanceOf(fromAddress: string, addressOf: string) {
        
        const data = await this.contract.methods.balanceOf(addressOf).call({ from: fromAddress });

        return parseInt(data, 10);
    }


    async transferTo(toAddress: string, amount: number, fromAddress: string) {
        
		console.log('transferring toAddress: ' + toAddress + ' amount: ' + amount + ' fromAddress: ' + fromAddress); 
        const tx = await this.contract.methods.transfer(toAddress, amount).send({
			...DEFAULT_SEND_OPTIONS,
            from: fromAddress
        });

        return tx;
    }

    async deploy(fromAddress: string, supply: number) {
		console.log('deploying fromAddress: ' + fromAddress + ' with supply: ' + supply)
		const deployTx = await (this.contract
            .deploy({
                data: IrcrpTokenJSON.bytecode,
                arguments: [supply]
            })
            .send({
                ...DEFAULT_SEND_OPTIONS,
                from: fromAddress,
                to: '0x0000000000000000000000000000000000000000'
            } as any) as any);

        this.useDeployed(deployTx.contractAddress);

        return deployTx.transactionHash;
    }

    useDeployed(contractAddress: string) {
        this.address = contractAddress;
        this.contract.options.address = contractAddress;
    }
}
