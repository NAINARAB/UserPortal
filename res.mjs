export function success(res, message, data, others) {
    return res.status(200).json({
        data: data || [],
        message: message || 'Done!',
        success: true,
        others: { ...others } || {}
    });
}

export function dataFound(res, data, message, others) {
    return res.status(200).json({
        data: data,
        message: message || 'Data Found',
        success: true,
        others: { ...others } || {}
    });
}

export function noData(res, message, others) {
    return res.status(200).json({
        data: [],
        success: true,
        message: message || 'No data',
        others: { ...others } || {}
    })
}

export function failed(res, message, others) {
    return res.status(400).json({
        data: [],
        message: message || 'Something Went Wrong! Please Try Again',
        success: false,
        others: { ...others } || {}
    })
}

export function servError(e, res, message, others) {
    console.log(e);
    return res.status(500).json({
        data: [],
        success: false,
        message: message || "Request Failed",
        others: { Error: e, ...others } || {}
    })
}

export function invalidInput(res, message, others) {
    return res.status(400).json({ 
        data: [], 
        success: false, 
        message: message || 'Invalid request', 
        others: { ...others } || {} 
    })
}