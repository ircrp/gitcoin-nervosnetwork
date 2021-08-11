/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { AddressTranslator } from 'nervos-godwoken-integration';

import { IrcrpTokenWrapper } from '../lib/contracts/IrcrpTokenWrapper';
import { CONFIG } from '../config';

async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };

        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider || Web3.givenProvider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<IrcrpTokenWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [l2Balance, setL2Balance] = useState<bigint>();
	const [contractTokenSupply, setContractTokenSupply] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [tokenSupply, setTokenSupply] = useState<number | undefined>();
	const [balanceAddress, setBalanceAddress] = useState<string | undefined>();
	const [balance, setBalance] = useState<bigint>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [transferToAddress, setTransferToAddress] = useState<string | undefined>();
	const [transferToAmount, setTransferToAmount] = useState<bigint | undefined>();

    useEffect(() => {
        if (accounts?.[0]) {
            const addressTranslator = new AddressTranslator();
            setPolyjuiceAddress(addressTranslator.ethAddressToGodwokenShortAddress(accounts?.[0]));
        } else {
            setPolyjuiceAddress(undefined);
        }
    }, [accounts?.[0]]);

    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function deployContract() {
        const _contract = new IrcrpTokenWrapper(web3);

        try {
            setDeployTxHash(undefined);
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account, contractTokenSupply);

            setDeployTxHash(transactionHash);
            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function getTokenSupply() {
        const tokenSupply = await contract.getTokenSupply(account);
        toast('Successfully retrieved token supply.', { type: 'success' });

        setTokenSupply(tokenSupply);
    }
	
    async function getBalance() {
        const _balance = await contract.balanceOf(account, balanceAddress);
        toast('Successfully retrieved balance: ' + _balance, { type: 'success' });

        setBalance(_balance);
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new IrcrpTokenWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
        setTokenSupply(undefined);
    }

    async function transferTo() {
		console.log('transferToAddress: ' + transferToAddress);
        try {
            setTransactionInProgress(true);
            await contract.transferTo(transferToAddress, transferToAmount, account);
            toast(
                'Successfully transferred token.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast.error(
                'There was an error sending your transaction. Please check developer console.'
            );
        } finally {
            setTransactionInProgress(false);
        }
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);

            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            console.log({ _accounts });

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setL2Balance(_l2Balance);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your Polyjuice address: <b>{polyjuiceAddress || ' - '}</b>
            <br />
            <br />
            Nervos Layer 2 balance:{' '}
            <b>{l2Balance ? (l2Balance / 10n ** 8n).toString() : <LoadingIndicator />} CKB</b>
            <br />
            <br />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            Deploy transaction hash: <b>{deployTxHash || '-'}</b>
            <br />
            <hr />
            <p>
                The button below will deploy IrcrpToken smart contract with total supply you specify and
				mint all of it to you. After the contract is deployed you can retrieve the total supply, 
				check current balance by address, and transfer the token to an address.
            </p>
            <button onClick={deployContract} disabled={!l2Balance}>
                Deploy new Token contract
            </button>
			&nbsp;enter total supply&nbsp;
			<input
                placeholder="Token supply"
                onChange={e => setContractTokenSupply(e.target.value)}
            />
            <br />
			Alternatively enter&nbsp;
            <input
                placeholder="Existing contract id"
                onChange={e => setExistingContractIdInputValue(e.target.value)}
            />
            <button
                disabled={!existingContractIdInputValue || !l2Balance}
                onClick={() => setExistingContractAddress(existingContractIdInputValue)}
            >
                Use existing contract
            </button>
            <br />
            <br />
            <button onClick={getTokenSupply} disabled={!contract}>
                Get Token Supply
            </button>
            {tokenSupply ? <>&nbsp;&nbsp;Total Supply: {tokenSupply.toString()}</> : null}
            <br />
			<br />
			<button onClick={getBalance} disabled={!contract}>
				Get Current Balance
			</button>
			&nbsp;enter address&nbsp;
			<input
                placeholder="Address"
                onChange={e => setBalanceAddress(e.target.value)}
            />
			{balance >= 0 ? <>&nbsp;&nbsp;Balance: {balance.toString()}</> : null}
			<br />
            <br />
			<button onClick={transferTo} disabled={!contract}>
                Transfer To
            </button>
			&nbsp;enter address&nbsp;
            <input
                placeholder="Transfer to address"
                onChange={e => setTransferToAddress(e.target.value)}
            />
			&nbsp;enter transfer amount&nbsp;
			<input
                placeholder="Transfer to amount"
                onChange={e => setTransferToAmount(parseInt(e.target.value, 10))}
            />
            <br />
            <br />
            <br />
            <br />
            <hr />
            The contract is deployed on Nervos Layer 2 - Godwoken + Polyjuice. After each
            transaction you might need to wait up to 120 seconds for the status to be reflected.
            <ToastContainer />
        </div>
    );
}
