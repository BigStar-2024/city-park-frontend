import { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import HtmlTooltip from './HtmlToolTip';
import axios from 'axios';
import { useAuthorize } from '../store/store';
import { DataItem, ConsolidatedRecord } from '../types';
import { TabView, TabPanel } from 'primereact/tabview';
import './TabViewDemo.css';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function ParkingSessionTable({ siteCode }: { siteCode?: string }) {
    const { user } = useAuthorize();
    const [dataArr, setDataArr] = useState<ConsolidatedRecord[]>([]);
    const [paidSessions, setPaidSessions] = useState<any[]>([]);
    // const [isLoading, setIsLoading] = useState(true);
    // const [usedPaymentLogs, setUsedPaymentLogs] = useState<Set<string>>(new Set());
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);


    const consolidateData = (rawData: DataItem[]): ConsolidatedRecord[] => {
        const recordMap = new Map<string, ConsolidatedRecord[]>();

        // Ensure all data items have defined times before processing
        const filteredData = rawData.filter(item => item.time !== undefined);

        // Sort to ensure chronological order for correct processing
        filteredData.sort((a, b) => new Date(a.time!).getTime() - new Date(b.time!).getTime());

        filteredData.forEach(item => {
            let records = recordMap.get(item.plateNumber) || [];
            if (item.direction === "ENTER") {
                records.push({
                    _id: item._id,
                    lot: item.lot,
                    camera: item.camera,
                    plateNumber: item.plateNumber,
                    plate: item.plate,
                    vehicle1: item.vehicle,
                    vehicle2: undefined,
                    direction: item.direction,
                    entryTime: item.time!,
                    exitTime: undefined,
                });
            } else { // Direction is "EXIT"
                const lastEntry = records.reverse().find(rec => rec.entryTime && !rec.exitTime && new Date(rec.entryTime) < new Date(item.time!));
                if (lastEntry) {
                    lastEntry.exitTime = item.time!;
                    lastEntry._id = item._id;
                    lastEntry.camera = item.camera;
                    lastEntry.plate = item.plate;
                    lastEntry.vehicle2 = item.vehicle;
                }
            }
            recordMap.set(item.plateNumber, records);
        });

        let allRecords = Array.from(recordMap.values()).flat();
        allRecords.sort((a, b) => new Date(b.entryTime!).getTime() - new Date(a.entryTime!).getTime());

        return allRecords;
    };

    const [documentCountAmount, setDocumentCountAmount] = useState<Number>()

    const fetchData = async () => {
        try {
            console.log("fetching now...")
            // setIsLoading(true);
            const { data } = await axios.get(`/data${siteCode ? "/site-code/" + siteCode : ""}`)
            const consolidatedData = consolidateData(data);
            setDataArr(consolidatedData);

            const response = await axios.get('/getPassDataCount');
            const documentCount = response.data;
            console.log(`Document count: ${documentCount}`);
            setDocumentCountAmount(documentCount);

            const paidResponse = await axios.get('/getPaidData');
            setPaidSessions(paidResponse.data);
            // setIsLoading(false);
            timeoutRef.current = setTimeout(fetchData, 30000);
        } catch (error) {
            console.error(error);
            // setIsLoading(false);
        }
    };

    const [refresh, setRefresh] = useState(false);
    useEffect(() => {
        const timeout = setInterval(() => {
            // Run your function here
            console.log("Function is running after 5 seconds");
            setRefresh(pre => !pre);

        }, 2000);

        return () => clearInterval(timeout);
    }, [refresh]);
    useEffect(() => {


        fetchData();
        return () => clearTimeout(timeoutRef.current || undefined);
    }, []);

    const plateNumberBody = (product: ConsolidatedRecord) => (
        <HtmlTooltip title={<div><span className="text-xl text-black">(Plate)</span><img src={`${import.meta.env.VITE_API_BACKEND_URL}public/${product.plate}`} /></div>}>
            <span><img src={`${import.meta.env.VITE_API_BACKEND_URL}public/${product.plate}`} /></span>
        </HtmlTooltip>
    );

    const vehicleBody = (product: ConsolidatedRecord) => {
        return <>
            <HtmlTooltip
                title={
                    <>
                        <div className=''>
                            <span className="text-xl text-black">(Entrance)</span>
                            <img src={`${import.meta.env.VITE_API_BACKEND_URL}public/${product.vehicle1}`} alt='No Enterance' />
                        </div>
                        <div className=''>
                            <span className="text-xl text-black">(Exit)</span>
                            <img src={`${import.meta.env.VITE_API_BACKEND_URL}public/${product.vehicle2}`} alt='Currently Parking...' />
                        </div>
                    </>
                }
            >
                <span className={`underline text-blue-500 cursor-pointer`}> (Entrance Exit) </span>
            </HtmlTooltip>
        </>;
    };

    let usedPaymentLogs: string[] = []; // Define usedPaymentLogs as an array of strings

    let count: number = 0; // Initialize count variable


    const getLogData = (lot: string, plateNumber: string): any => {

        const session = paidSessions.find((s: any) => s.parkName === lot && s.licensePlateNumber === plateNumber && !usedPaymentLogs.includes(s._id));

        if (session) {
            console.log("----->", usedPaymentLogs);
            count++;
            if (count == 3) {
                count = 0;
                usedPaymentLogs.push(session._id)
                console.log("======>", usedPaymentLogs);
            }
            console.log('Hello', { createDate: session['createDate'], status: session['status'], amount: session['amount'] });

            return { createDate: session['createDate'], status: session['status'], amount: '$' + session['amount'] };

        } else {
            return { createDate: "", status: "", amount: "" };
        }
    };
    // Utility function to calculate parking time in hours
    const calculateParkingTimeInHours = (entryTime: string, exitTime: string): number => {
        const entryDate = new Date(entryTime);
        const exitDate = new Date(exitTime);
        const periodTime = (exitDate.getTime() - entryDate.getTime()) / 3600000; // Convert milliseconds to hours
        return periodTime;
    };
    // Filtering data based on the condition
    const violationArr = dataArr.filter((item) => {
        if (item.entryTime && item.exitTime) {
            const parkingTimeInHours = calculateParkingTimeInHours(item.entryTime, item.exitTime);
            const amount = getLogData(item.lot, item.plateNumber).amount;
            return amount < 3 * parkingTimeInHours;
        }
        return false;
    });
    const non_violationArr = dataArr.filter(item =>
        !violationArr.some(violation =>
            violation.lot === item.lot && violation.plateNumber === item.plateNumber
        )
    );

    
    return (
        <>
            {(
                <div className="p-2 bg-white rounded-lg w-min-[1300px] overflow-x-auto">
                    <div className="flex justify-between">
                        <h1 className='font-bold p-2 text-lg'>Sessions & Violations</h1>
                        <div className='flex gap-2 items-center'>
                            <div className='p-2 rounded-md bg-blue-700 flex justify-center items-center w-fit cursor-pointer hover:opacity-80'>
                                <svg className='w-4 h-4 fill-white'><use href="#svg-refresh" /></svg>
                            </div>
                            <div className='px-3 py-1 border border-[#ccc] rounded-md text-sm'>{documentCountAmount?.toString()} Records</div>
                        </div>
                    </div>
                    <div className='flex max-md:flex-col justify-between items-center'>
                        <div className="card">
                            <TabView>
                                {user?.customClaims.admin && <TabPanel header="LPR Sessions">
                                    <DataTable paginator rows={5} pageLinkSize={2} rowsPerPageOptions={[5, 10, 25, 50]}
                                        value={dataArr} tableStyle={{ minWidth: '50rem' }} pt={{
                                            thead: { className: "text-[14px]" },
                                            paginator: {
                                                pageButton: ({ context }: { context: any }) => ({
                                                    className: context.active ? 'bg-blue-500 text-white text-[12px]' : undefined,
                                                }),
                                            },
                                        }}>
                                        <Column field="lot" header="Lot name" sortable style={{ width: '10%' }}></Column>
                                        <Column field="camera" header="Camera" sortable style={{ width: '10%' }}></Column>
                                        <Column field="plateNumber" header="Plate number" sortable style={{ width: '10%' }}></Column>
                                        <Column field="plate" header="" body={plateNumberBody} style={{ width: '10%' }}></Column>
                                        <Column field="vehicle" header="Vehicle" body={vehicleBody} sortable style={{ width: '20%' }}></Column>
                                        <Column header="Entry Time" body={(item: ConsolidatedRecord) =>
                                            <>
                                                {<span>{item.entryTime ? new Date(item.entryTime).toLocaleString("en-us") : ""}</span>}
                                            </>
                                        } sortable style={{ width: '15%' }}></Column>
                                        <Column header="Exit Time" body={(item: ConsolidatedRecord) =>
                                            <>
                                                {<span>{item.exitTime ? new Date(item.exitTime).toLocaleString("en-us") : ""}</span>}
                                            </>
                                        } sortable style={{ width: '15%' }}></Column>
                                    </DataTable>
                                </TabPanel>}
                                {user?.customClaims.admin && <TabPanel header="Paid Sessions">
                                    <DataTable paginator rows={5} pageLinkSize={2} rowsPerPageOptions={[5, 10, 25, 50]}
                                        value={dataArr} tableStyle={{ minWidth: '50rem' }} pt={{
                                            thead: { className: "text-[14px]" },
                                            paginator: {
                                                pageButton: ({ context }: { context: any }) => ({
                                                    className: context.active ? 'bg-blue-500 text-white text-[12px]' : undefined,
                                                }),
                                            },
                                        }}>
                                        <Column field="lot" header="Lot name" sortable style={{ width: '10%' }}></Column>
                                        <Column field="plateNumber" header="Plate number" sortable style={{ width: '10%' }}></Column>
                                        <Column field="plate" header="" body={plateNumberBody} style={{ width: '10%' }}></Column>
                                        <Column field="parking time" header="Parking Time" body={(item: ConsolidatedRecord) =>
                                            <>
                                                {<span>{item.exitTime && item.entryTime ? (
                                                    (() => {
                                                        const entryTime: Date = new Date(item.entryTime);
                                                        const exitTime: Date = new Date(item.exitTime);

                                                        const periodTime: number = exitTime.getTime() - entryTime.getTime();

                                                        const hours: number = Math.floor(periodTime / 3600000);
                                                        const minutes: number = Math.floor((periodTime % 3600000) / 60000);
                                                        const seconds: number = Math.floor((periodTime % 60000) / 1000);

                                                        const periodTimeString: string = `${hours} hours, ${minutes} minutes, ${seconds} seconds`;

                                                        return <span>{periodTimeString}</span>;
                                                    })()
                                                ) : (
                                                    <span>Parking</span>
                                                )}</span>}
                                            </>
                                        } sortable style={{ width: '30%' }}></Column>
                                        <Column field="created date" header="CreatedDate" body={(item: ConsolidatedRecord) =>
                                            <>
                                                {<span>{getLogData(item.lot, item.plateNumber).createDate}</span>}
                                            </>
                                        } sortable style={{ width: '24%' }}></Column>
                                        <Column field="paid result" header="Paid Status" body={(item: ConsolidatedRecord) =>
                                            <>
                                                {<span>{getLogData(item.lot, item.plateNumber).status}</span>}
                                            </>
                                        } sortable style={{ width: '20%' }}></Column>
                                        <Column field="paid amount" header="Paid Amount" body={(item: ConsolidatedRecord) =>
                                            <>
                                                {<span>{getLogData(item.lot, item.plateNumber).amount}</span>}
                                            </>
                                        } sortable style={{ width: '20%' }}></Column>
                                    </DataTable>
                                </TabPanel>}
                                <TabPanel header="Non-Violation">
                                    <DataTable paginator rows={5} pageLinkSize={2} rowsPerPageOptions={[5, 10, 25, 50]}
                                        value={non_violationArr} tableStyle={{ minWidth: '50rem' }} pt={{
                                            thead: { className: "text-[14px]" },
                                            paginator: {
                                                pageButton: ({ context }: { context: any }) => ({
                                                    className: context.active ? 'bg-blue-500 text-white text-[12px]' : undefined,
                                                }),
                                            },
                                        }}>
                                        <Column field="lot" header="Lot name" sortable style={{ width: '10%' }}></Column>
                                        <Column field="plateNumber" header="Plate number" sortable style={{ width: '10%' }}></Column>
                                        <Column field="plate" header="" body={plateNumberBody} style={{ width: '10%' }}></Column>
                                        <Column field="parking time" header="Parking Time" body={(item: ConsolidatedRecord) =>
                                            <>
                                                {<span>{item.exitTime && item.entryTime ? (
                                                    (() => {
                                                        const entryTime: Date = new Date(item.entryTime);
                                                        const exitTime: Date = new Date(item.exitTime);

                                                        const periodTime: number = exitTime.getTime() - entryTime.getTime();

                                                        const hours: number = Math.floor(periodTime / 3600000);
                                                        const minutes: number = Math.floor((periodTime % 3600000) / 60000);
                                                        const seconds: number = Math.floor((periodTime % 60000) / 1000);

                                                        const periodTimeString: string = `${hours} hours, ${minutes} minutes, ${seconds} seconds`;

                                                        return <span>{periodTimeString}</span>;
                                                    })()
                                                ) : (
                                                    <span>Parking</span>
                                                )}</span>}
                                            </>
                                        } sortable style={{ width: '30%' }}></Column>
                                        <Column field="created date" header="CreatedDate" body={(item: ConsolidatedRecord) =>
                                            <>
                                                {<span>{getLogData(item.lot, item.plateNumber).createDate}</span>}
                                            </>
                                        } sortable style={{ width: '20%' }}></Column>
                                        <Column field="paid result" header="Paid Status" body={(item: ConsolidatedRecord) =>
                                            <>
                                                {<span>{getLogData(item.lot, item.plateNumber).status}</span>}
                                            </>
                                        } sortable style={{ width: '10%' }}></Column>
                                        <Column field="paid amount" header="Paid Amount" body={(item: ConsolidatedRecord) =>
                                            <>
                                                {<span>{getLogData(item.lot, item.plateNumber).amount}</span>}
                                            </>
                                        } sortable style={{ width: '10%' }}></Column>
                                    </DataTable>
                                </TabPanel>
                                <TabPanel header="Violations">
                                    <DataTable paginator rows={5} pageLinkSize={2} rowsPerPageOptions={[5, 10, 25, 50]}
                                        value={violationArr} tableStyle={{ minWidth: '50rem' }} pt={{
                                            thead: { className: "text-[14px]" },
                                            paginator: {
                                                pageButton: ({ context }: { context: any }) => ({
                                                    className: context.active ? 'bg-blue-500 text-white text-[12px]' : undefined,
                                                }),
                                            },
                                        }}>
                                        <Column field="lot" header="Lot name" sortable style={{ width: '10%' }}></Column>
                                        <Column field="plateNumber" header="Plate number" sortable style={{ width: '10%' }}></Column>
                                        <Column field="plate" header="" body={plateNumberBody} style={{ width: '10%' }}></Column>
                                        <Column field="parking time" header="Parking Time" body={(item: ConsolidatedRecord) =>
                                            <>
                                                {<span>{item.exitTime && item.entryTime ? (
                                                    (() => {
                                                        const entryTime: Date = new Date(item.entryTime);
                                                        const exitTime: Date = new Date(item.exitTime);

                                                        const periodTime: number = exitTime.getTime() - entryTime.getTime();

                                                        const hours: number = Math.floor(periodTime / 3600000);
                                                        const minutes: number = Math.floor((periodTime % 3600000) / 60000);
                                                        const seconds: number = Math.floor((periodTime % 60000) / 1000);

                                                        const periodTimeString: string = `${hours} hours, ${minutes} minutes, ${seconds} seconds`;

                                                        return <span>{periodTimeString}</span>;
                                                    })()
                                                ) : (
                                                    <span>Parking</span>
                                                )}</span>}
                                            </>
                                        } sortable style={{ width: '30%' }}></Column>
                                        <Column field="created date" header="CreatedDate" body={(item: ConsolidatedRecord) =>
                                            <>
                                                {<span>{getLogData(item.lot, item.plateNumber).createDate}</span>}
                                            </>
                                        } sortable style={{ width: '20%' }}></Column>
                                        <Column field="paid result" header="Paid Status" body={(item: ConsolidatedRecord) =>
                                            <>
                                                {<span>{getLogData(item.lot, item.plateNumber).status}</span>}
                                            </>
                                        } sortable style={{ width: '10%' }}></Column>
                                        <Column field="paid amount" header="Paid Amount" body={(item: ConsolidatedRecord) =>
                                            <>
                                                {<span>{getLogData(item.lot, item.plateNumber).amount}</span>}
                                            </>
                                        } sortable style={{ width: '10%' }}></Column>
                                    </DataTable>
                                </TabPanel>
                                {user?.customClaims.admin && <TabPanel header="Error">
                                    <h1>Now, there aren't any errors.</h1>
                                </TabPanel>}
                            </TabView>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


