const isEmpty = (val: any) => (undefined === val || null === val || (typeof val === "string" && val.length<=0));


export default {
    isEmpty
};
