// Debug received HTTP method
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    json_response([
        'success' => false,
        'message' => 'Method not allowed.',
        'received_method' => $_SERVER['REQUEST_METHOD']
    ], 405);
}
